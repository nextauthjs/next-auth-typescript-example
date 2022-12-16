import { NextApiRequest, NextApiResponse } from "next"
import { ApiError } from "next/dist/server/api-utils"

import GFW from "../../../libs/gfw-client"
import { withGFWAuth } from "../../../libs/middlewares/with-gfw-auth"
import { withMiddleware } from "../../../libs/middlewares/with-middleware"

export default withMiddleware(withGFWAuth(handler))

async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
  client: GFW
) {
  try {
    const response = await client.get(`/auth/me`)
    if (response.ok) {
      const data = await response.json()
      return res.status(response.status).json(data)
    } else {
      throw new ApiError(response.status, await response.text())
    }
  } catch (e: any) {
    if (e instanceof ApiError)
      return res.status(e.statusCode).json({
        error: e.message,
      })
    else
      return res.status(400).json({
        error: e.message,
      })
  }
}
