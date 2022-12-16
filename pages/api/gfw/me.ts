import { NextApiRequest, NextApiResponse } from "next"
import { getToken, JWT } from "next-auth/jwt"
import GFW from "../../../libs/gfw-client"

const GFW_API_GATEWAY = process.env.GFW_API_GATEWAY ?? ""

export interface GFWJWT extends JWT {
  gfw?: {
    bearerToken?: string
    refreshToken?: string
  }
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
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
    try {
      const response = await client.get(`/auth/me`)
      const data = await response.json()
      return res.status(response.status).json(data)
    } catch (e: any) {
      return res.status(400).json({
        status: e.message,
      })
    }
  }

  return res.status(401).json({
    error: "You must be sign in to view the protected content on this page.",
  })
}
