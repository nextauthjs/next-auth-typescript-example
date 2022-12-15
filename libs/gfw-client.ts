const getUrl = (gateway: string, endpoint?: string) =>
  `${gateway}${endpoint ? "/" + endpoint : ""}`

const getAuthUrl = (gateway: string) => getUrl(gateway, 'auth')

  type GFWConfig = {
  gatewayUrl: string
  version: string
  client?: string
  accessToken?: string
  bearerToken?: string
  refreshToken?: string
}
const defaults: GFWConfig = {
  gatewayUrl: "https://gateway.api.globalfishingwatch.org",
  version: "v2",
}

const baseHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

class GFW {
  url: string
  auth: string
  config: GFWConfig

  constructor(options: Partial<GFWConfig>) {
    const config = Object.assign({}, defaults, options)

    this.url = getUrl(config.gatewayUrl, config.version)
    this.auth = getAuthUrl(config.gatewayUrl)
    this.config = config
  }
  /**
   * Resolve the TEXT parsed from the successful response or reject the JSON from the error
   * @param {Response} response - the Response object returned by Fetch
   * @return {Promise<object>}
   * @throws {Promise<object>}
   * @private
   */
  static async _handleResponseTextOrJson(response: Response) {
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

  static async getBearerToken(gatewayUrl: string, accessToken: string) {
    const authUrl = getAuthUrl(gatewayUrl)
    const requestData = {
      url: `${authUrl}/token?access-token=${accessToken}`,
      method: "GET",
    }
    const headers = {}
    const results = await fetch(requestData.url, {
      method: requestData.method,
      headers: Object.assign({}, baseHeaders, headers),
    }).then(GFW._handleResponseTextOrJson)

    return results
  }

  async getBearerToken() {
    const results = await GFW.getBearerToken(this.config.gatewayUrl, this.config.accessToken ?? '')
    
    if (results.token) this.config.bearerToken = results.token
    if (results.refreshToken) this.config.refreshToken = results.refreshToken
    
    return results
  }
}

export default GFW
