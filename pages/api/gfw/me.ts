import { NextApiRequest, NextApiResponse } from "next"
import { getToken, JWT } from "next-auth/jwt"

const GFW_API_GATEWAY = process.env.GFW_API_GATEWAY

export interface GFWJWT extends JWT {
  gfw?: {
    accessToken?: string
    refreshToken?: string
  }
}
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token: GFWJWT | null = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token?.gfw?.accessToken) {

    try {
      const results = await fetch(`${GFW_API_GATEWAY}/auth/me`, { headers: {
        'Authorization': `Bearer ${token?.gfw?.accessToken}`
      } })
      const data = await results.json()
      return res.status(results.status).json(data)
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
