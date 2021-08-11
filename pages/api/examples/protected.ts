// This is an example of to protect an API route
import { getSession } from "next-auth/react"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function protectedHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })

  if (session) {
    return res.send({
      content:
        "This is protected content. You can access this content because you are signed in.",
    })
  }

  res.send({
    error: "You must be sign in to view the protected content on this page.",
  })
}
