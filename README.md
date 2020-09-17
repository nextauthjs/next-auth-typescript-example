# NextAuth.js Example

[next-auth-example.now.sh](https://next-auth-example.now.sh)

## About this project

This is an example of how to use [NextAuth.js](https://next-auth.js.org) library and [TypeScript](https://www.typescriptlang.org/) to add authentication to a [Next.js](https://nextjs.org) application.

## About NextAuth.js

NextAuth.js is an easy to implement, full-stack (client/server) open source authentication library designed for [Next.js](https://nextjs.org) and [Serverless](https://now.sh).

Go to [next-auth.js.org](https://next-auth.js.org) for more information and documentation.

*NextAuth.js is not associated with Vercel or Next.js.*

## Getting started

### 1. Clone the repository and install dependancies

```
git clone https://github.com/iaincollins/next-auth-example.git
cd next-auth-example
npm i
```

### 2. Configure your local environment

Copy the .env.local.example file in this directory to .env.local (which will be ignored by Git):

```
cp .env.local.example .env.local
```

Add details for one or more providers (e.g. Google, Twitter, GitHub, Email, etc).

#### Database configuration

A database is needed to persist user accounts and to support email sign in, but you can still use NextAuth.js for authentication without one by using OAuth for authentication. If you do not specify a database, JSON Web Tokens will be enabled by default.

You can skip configuring a database and come back to it later if you want.

When configuring your database you should also install an appropriate node_module.

* **SQLite**

  Install module:
  `npm i sqlite3`

  Database URI:
  `sqlite://localhost/:memory:?synchronize=true`

* **MySQL**

  Install module:
  `npm i mysql`

  Database URI:
  `mysql://username:password@127.0.0.1:3306/database_name?synchronize=true`

* **Postgres**

  Install module:
  `npm i pg`

  Database URI:
  `postgres://username:password@127.0.0.1:5432/database_name?synchronize=true`

* **MongoDB**

  Install module:
  `npm i mongodb`

  Database URI:
  `mongodb://username:password@127.0.0.1:27017/database_name?synchronize=true`

Notes:

* The example .env specifies an in-memory SQLite database that does not persist data.
* SQLite is suitable for development / testing but not for production.
* The option `?synchronize=true` automatically syncs schema changes to the database. It should not be used in production as may result in data loss if there are changes to the schema or to NextAuth.js
* You can also specify a [TypeORM connection object](https://typeorm.io/#/connection-options) in `pages/api/auth/[...nextauth].ts` instead of a database URL / connection string.

### 3. Configure authentication providers

* Review and update options in `pages/api/auth/[...nextauth].ts` as needed.

* When setting up OAUTH, in the developer admin page for each of your OAuth services, you should configure the callback URL to use a callback path of `{server}/api/auth/callback/{provider}`.

  e.g. For Google OAuth you would use: `http://localhost:3000/api/auth/callback/google`

  A list of configured providers and their callback URLs is available from the endpoint `/api/auth/providers`. You can find more information at https://next-auth.js.org/configuration/providers

* You can also choose to specify an SMTP server for passwordless sign in via email.

### 4. Start the application

To run your site locally, use:

```
npm run dev
```

To run it it production mode, use:

```
npm build
npm start
```

### 5. Configuring for production

You must set the NEXTAUTH_URL environment variable with the URL of your site, before deploying to production.

e.g. `NEXTAUTH_URL=https://example.com`

To do this in on Vercel, you can use the [Vercel project dashboard](https://vercel.com/dashboard) or the `now env` command:

    now env add NEXTAUTH_URL production

Be sure to also set environment variables for the Client ID and Client Secret values for all your authentication providers.

