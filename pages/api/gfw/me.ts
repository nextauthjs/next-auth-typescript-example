import { NextApiRequest, NextApiResponse } from "next"
import { ApiError } from "next/dist/server/api-utils"
import GFW from "../../../libs/gfw-client"
import { withException } from "../../../libs/middlewares/with-exception"
import { withGFWAuth } from "../../../libs/middlewares/with-gfw-auth"

export default withException(withGFWAuth(handler))

async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
  client: GFW
) {
  const response = await client.get(`/auth/me`)
  if (response.ok) {
    const data = await response.json()
    return res.status(response.status).json(data)
  } else {
    throw new ApiError(response.status, await response.text())
  }
}
