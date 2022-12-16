import { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { ApiError } from "next/dist/server/api-utils"
import { HTTPStatusCodes } from "../../types/http-status-codes"

export const withException =
  (handler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (exception) {
      const { url, headers } = req

      const statusCode = getExceptionStatus(exception)
      const message = getExceptionMessage(exception)
      const stack = getExceptionStack(exception)

      const referer = headers["referer"]
      const userAgent = headers["user-agent"]

      const requestContext = {
        url,
        referer,
        userAgent,
        message,
      }

      const exceptionMessage = `An unhandled exception occurred.`
      console.error(requestContext, exceptionMessage)

      // if we are able to retrieve the stack, we add it to the debugging logs
      if (stack) {
        console.debug(stack)
      }

      const timestamp = new Date().toISOString()
      // return just enough information without leaking any data
      const responseBody = {
        statusCode,
        message,
        timestamp,
      }

      return res.status(statusCode).send(responseBody)
    }
  }

function getExceptionStatus(exception: unknown) {
  return exception instanceof ApiError
    ? exception.statusCode
    : HTTPStatusCodes.INTERNAL_SERVER_ERROR
}

function getExceptionMessage(exception: unknown) {
  return isError(exception) ? exception.message : `Internal Server Error`
}

function getExceptionStack(exception: unknown) {
  return isError(exception) ? exception.stack : undefined
}

function isError(exception: unknown): exception is Error {
  return exception instanceof Error
}
