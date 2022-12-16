import { NextApiRequest, NextApiResponse } from "next"
import { getToken, JWT } from "next-auth/jwt"
import GFW from "../gfw-client"

const GFW_API_GATEWAY = process.env.GFW_API_GATEWAY ?? ""

export interface GFWJWT extends JWT {
  gfw?: {
    bearerToken?: string
    refreshToken?: string
  }
}

declare type GFWHandler<T = any> = (req: NextApiRequest, res: NextApiResponse<T>, client: GFW) => any | Promise<any>

export const withGFWAuth = (handler: GFWHandler) => async(
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  const token: GFWJWT | null = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token?.gfw?.bearerToken) {
    const client = new GFW({
      gatewayUrl: GFW_API_GATEWAY,
      bearerToken: token?.gfw?.bearerToken,
      refreshToken: token?.gfw?.refreshToken,
    })
    return handler(req, res, client)
  }

  return res.status(401).json({
    error: "You must be sign in to view the protected content on this page.",
  })
}
