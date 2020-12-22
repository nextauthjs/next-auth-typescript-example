// This is an example of how to read a JSON Web Token from an API route
import jwt from 'next-auth/jwt'
import type { NextApiRequest, NextApiResponse } from "next";

const secret = process.env.SECRET!

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = await jwt.getToken({ req, secret })
  res.send(JSON.stringify(token, null, 2))
}