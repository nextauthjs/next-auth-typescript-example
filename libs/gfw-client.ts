const getUrl = (gateway: string, endpoint?: string) =>
  `${gateway}${endpoint ? "/" + endpoint : ""}`

const getAuthUrl = (gateway: string) => getUrl(gateway, "auth")

type GFWConfig = {
  gatewayUrl: string
  version?: string
  client?: string
  accessToken?: string
  bearerToken?: string
  refreshToken?: string
}

type Token = {
  token: string
  refreshToken: string
}

type RequestData = {
  requestData: {
    url: string
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
    data?: Record<string, string>
  }
  headers: Headers
}
const defaults: GFWConfig = {
  gatewayUrl: "https://gateway.api.globalfishingwatch.org",
  version: "v2",
}

const baseHeaders = new Headers({
  "Content-Type": "application/json",
  Accept: "application/json",
})

/**
 * Parse the JSON from a Response object and add the Headers under `_headers`
 * @param response the Response object returned by fetch
 * @returns Promise resolving to the json contents of the response
 */
async function _handleResponse(response: Response) {
  const headers = response.headers
  if (response.ok) {
    // Return empty response on 204 "No content", or Content-Length=0
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    )
      return {
        _headers: headers,
      }
    // Otherwise, parse JSON response
    return response.json().then((res) => {
      res._headers = headers // TODO: this creates an array-like object when it adds _headers to an array response
      return res
    })
  } else {
    throw {
      _headers: headers,
      ...(await response.json()),
    }
  }
}
/**
 * Resolve the TEXT parsed from the successful response or reject the JSON from the error
 * @param {Response} response - the Response object returned by Fetch
 * @return {Promise<object>}
 * @throws {Promise<object>}
 * @private
 */
async function _handleResponseTextOrJson(response: Response) {
  let body = await response.text()
  if (response.ok) {
    let results
    try {
      // convert to object if it is a json
      results = JSON.parse(body)
    } catch (e) {
      // it is not a json
      results = body
    }
    return Promise.resolve(results)
  } else {
    let error
    try {
      // convert to object if it is a json
      error = JSON.parse(body)
    } catch (e) {
      // it is not a json
      error = body
    }
    return Promise.reject(error)
  }
}

/**
 * Performs request to the GFW api to refresh the token
 * @param gatewayUrl GFW Api gateway url
 * @param accessToken accessToken to use for logging in
 * @returns Promise resolving to the new token
 */
async function _refreshToken(gatewayUrl: string, refreshToken?: string) {
  const authUrl = getAuthUrl(gatewayUrl)
  const requestData = {
    url: `${authUrl}/token/reload`,
    method: "GET",
  }
  const headers = {
    "refresh-token": refreshToken,
  }
  const results = await fetch(requestData.url, {
    method: requestData.method,
    headers: Object.assign({}, baseHeaders, headers) as any,
  }).then(_handleResponseTextOrJson)

  return results
}

/**
 * GFW API client
 */
class GFW {
  /**
   * GFW Api gateway url
   */
  url: string
  /**
   * GFW Auth gateway url
   */
  auth: string
  /**
   * Configuration variables used by the client
   */
  config: GFWConfig

  /**
   * Creates a new instance of the GFW Api client
   * @param options
   */
  constructor(options: GFWConfig) {
    const config = Object.assign({}, defaults, options)

    this.url = getUrl(config.gatewayUrl, config.version)
    this.auth = getAuthUrl(config.gatewayUrl)
    this.config = config
  }

  /**
   * Performs login against the GFW API with the given access_token
   * and stores the bearer and refresh tokens in the client config
   * to be used in the upcoming requests
   * @param gatewayUrl GFW Api gateway url
   * @param accessToken accessToken to use for logging in
   * @returns Promise resolving to the tokens returned from the API.
   */
  static async login(gatewayUrl: string, accessToken: string): Promise<Token> {
    const authUrl = getAuthUrl(gatewayUrl)
    const requestData = {
      url: `${authUrl}/token?access-token=${accessToken}`,
      method: "GET",
    }
    const headers = {}
    const results = await fetch(requestData.url, {
      method: requestData.method,
      headers: Object.assign({}, baseHeaders, headers),
    }).then(_handleResponseTextOrJson)

    return results
  }

  /**
   * Performs login against the GFW API with the given access_token
   * and stores the bearer and refresh tokens in the client config
   * to be used in the upcoming requests
   * @returns Promise resolving to the tokens returned from the API.
   */
  async login(): Promise<Token> {
    const results = await GFW.login(
      this.config.gatewayUrl,
      this.config.accessToken ?? ""
    )

    if (results.token) this.config.bearerToken = results.token
    if (results.refreshToken) this.config.refreshToken = results.refreshToken

    return results
  }

  /**
   * Performs request to the GFW api to refresh the token
   * @returns Promise resolving to the new token
   */
  private async _refreshToken() {
    const results = await _refreshToken(
      this.config.gatewayUrl,
      this.config.refreshToken ?? ""
    )

    if (results.token) this.config.bearerToken = results.token

    return results
  }

  /**
   * Construct the data and headers for an authenticated HTTP request
   * @param method "GET", "POST", "PUT", "DELETE" or "PATCH"
   * @param resource the API endpoint
   * @param parameters
   * @returns Request data object
   */
  private _makeRequest(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    resource: string,
    parameters?: Record<string, string>
  ): RequestData {
    const requestData: any = {
      url: `${this.url}${resource}`,
      method,
    }
    if (parameters)
      if (["POST", "PUT", "PATCH"].includes(method))
        requestData.data = parameters
      else requestData.url += "?" + new URLSearchParams(parameters).toString()

    const headers = {
      Authorization: `Bearer ${this.config.bearerToken}`,
    }
    return {
      requestData,
      headers: new Headers(headers),
    }
  }

  /**
   * Send a GET request
   * @param resource endpoint
   * @param parameters optional parameters to be send in the query
   * @returns Promise resolving to the response from the API.
   */
  get(
    resource: string,
    parameters?: Record<string, string>
  ): Promise<Response> {
    const { requestData, headers } = this._makeRequest(
      "GET",
      resource,
      parameters
    )

    return (
      fetch(requestData.url, { headers })
        // .then(_handleResponse)
        .then(async (res: Response) => {
          if (!res.ok && res.status === 401 && this.config.refreshToken) {
            return await this._refreshToken()
              .then(() =>
                // Retry request after refreshing token
                this.get(resource, parameters)
              )
              .catch(
                (_) =>
                  // Token refresh was unsuccessful,
                  // returning response from get request
                  res
              )
          }
          return res
        })
    )
  }
}

export default GFW
