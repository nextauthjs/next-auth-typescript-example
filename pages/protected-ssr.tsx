// This is an example of how to protect content using server rendering
import { getSession, Session } from 'next-auth/client'
import Layout from '../components/layout'
import AccessDenied from '../components/access-denied'
import { GetServerSideProps } from 'next'

type Page = {
  content: any,
  session: Session
}

export default function Page ({ content, session }: Page) {
  // If no session exists, display access denied message
  if (!session) { return  <Layout><AccessDenied/></Layout> }

  // If session exists, display content
  return (
    <Layout>
      <h1>Protected Page</h1>
      <p><strong>{content}</strong></p>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async(context) => {
  const session = await getSession(context)
  let content = null

  if (session) {
    const hostname = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const options = { headers: { cookie: context.req.headers.cookie! } }
    const res = await fetch(`${hostname}/api/examples/protected`, options)
    const json = await res.json()
    if (json.content) { content = json.content }
  }

  return {
    props: {
      session,
      content
    }
  }
}
