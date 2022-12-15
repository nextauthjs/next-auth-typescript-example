import { NextApiRequest, NextApiResponse } from "next"
import NextAuth from "next-auth"
// import GoogleProvider from "next-auth/providers/google"

const GFW_API_GATEWAY = process.env.GFW_API_GATEWAY

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

export default async function auth(req: NextApiRequest, res: NextApiResponse) {

  const callbackUrl = new URL(req.cookies["next-auth.callback-url"] ?? 'http://localhost:3000')

  return await NextAuth(req, res, {
  // https://next-auth.js.org/configuration/providers
  providers: [

    {
      id: 'gfw',
      name: 'GlobalFishingWatch SSO',
      type: 'oauth',
      clientId: 'gfw',
      authorization: {
        url: `${GFW_API_GATEWAY}/auth`,
        params: { client: "gfw", callback: `${callbackUrl.protocol}//${callbackUrl.host}/api/auth/callback/gfw` },
      },
      idToken: true,
      token: {
        url: `${GFW_API_GATEWAY}/auth/token`,
        async request(context) {
          const access_token = req.query['access-token'] 
          const tokenUrl = `${GFW_API_GATEWAY}/auth/token?access-token=${access_token}`
          const response = await fetch(tokenUrl)
          const json = await response.json()
          const tokens = {
            access_token: json?.token,
            refresh_token: json?.refreshToken,
            id_token: json?.token}
          return { tokens }
        }
      },
      userinfo: `${GFW_API_GATEWAY}/auth/me`,
      profile(profile) {
        console.log(profile)
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: profile.data.email,
          image: profile.data.photo,
        }
      },
      // requestTokenUrl: 

     },

    // GoogleProvider({
    //   clientId: process.env.GOOGLE_ID,
    //   clientSecret: process.env.GOOGLE_SECRET,
    // }),
  ],
  // Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
  // https://next-auth.js.org/configuration/databases
  //
  // Notes:
  // * You must install an appropriate node_module for your database
  // * The Email provider requires a database (OAuth providers do not)
  // database: process.env.DATABASE_URL,

  // The secret should be set to a reasonably long random string.
  // It is used to sign cookies and to sign and encrypt JSON Web Tokens, unless
  // a separate secret is defined explicitly for encrypting the JWT.
  secret: process.env.SECRET,

  session: {
    // Use JSON Web Tokens for session instead of database sessions.
    // This option can be used with or without a database for users/accounts.
    // Note: `strategy` should be set to 'jwt' if no database is used.
    strategy: 'jwt'

    // Seconds - How long until an idle session expires and is no longer valid.
    // maxAge: 30 * 24 * 60 * 60, // 30 days

    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    // updateAge: 24 * 60 * 60, // 24 hours
  },

  // JSON Web tokens are only used for sessions if the `strategy: 'jwt'` session
  // option is set - or by default if no database is specified.
  // https://next-auth.js.org/configuration/options#jwt
  jwt: {
    // A secret to use for key generation (you should set this explicitly)
    secret: process.env.SECRET,
    // Set to true to use encryption (default: false)
    // encryption: true,
    // You can define your own encode/decode functions for signing and encryption
    // if you want to override the default behaviour.
    // encode: async ({ secret, token, maxAge }) => {},
    // decode: async ({ secret, token, maxAge }) => {},
  },

  // You can define custom pages to override the built-in ones. These will be regular Next.js pages
  // so ensure that they are placed outside of the '/api' folder, e.g. signIn: '/auth/mycustom-signin'
  // The routes shown here are the default URLs that will be used when a custom
  // pages is not specified for that route.
  // https://next-auth.js.org/configuration/pages
  pages: {
    // signIn: '/auth/signin',  // Displays signin buttons
    // signOut: '/auth/signout', // Displays form with sign out button
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // Used for check email page
    // newUser: null // If set, new users will be directed here on first sign in
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  // https://next-auth.js.org/configuration/callbacks
  callbacks: {
    // async signIn({ user, account, profile, email, credentials }) { return true },
    // async redirect({ url, baseUrl }) { return baseUrl },
    // async session({ session, token, user }) { return session },

    async jwt({token, user, account = {}, profile, isNewUser}) {
      const result: any = token
      
      if (account?.provider) {

        if (!result[account.provider] ) {
          result[account.provider] = {};
        }
        
        if ( account?.access_token ) {
          result[account.provider].accessToken = account.access_token;
        }
        
        if ( account?.refresh_token ) {
          result[account.provider].refreshToken = account.refresh_token;
        }
      }

      return result;
    },
  },

  // Events are useful for logging
  // https://next-auth.js.org/configuration/events
  events: {},

  // Enable debug messages in the console if you are having problems
  debug: true,
})
}