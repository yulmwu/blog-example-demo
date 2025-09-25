export type HTTPError = {
    statusCode: number
    message: string
}

export const badRequest = (message: string): HTTPError => ({
    statusCode: 400,
    message,
})

export const unAuthorized = (message?: string): HTTPError => ({
    statusCode: 401,
    // message: message ?? 'Unauthorized',
    message: `Unauthorized ${message ? `: ${message}` : ''}`,
})

export const forbidden = (message?: string): HTTPError => ({
    statusCode: 403,
    message: `Forbidden ${message ? `: ${message}` : ''}`,
})

export const notFound = (message?: string): HTTPError => ({
    statusCode: 404,
    message: `Not Found ${message ? `: ${message}` : ''}`,
})

export const internalServerError = (message?: string): HTTPError => ({
    statusCode: 500,
    message: `Internal Server Error ${message ? `: ${message}` : ''}`,
})

export const error = (err: HTTPError, code: string) => ({
    statusCode: err.statusCode,
    body: JSON.stringify({ error: err.message, code }),
})

export const required = (...fields: string[]) => `Missing required fields: ${fields.join(', ')}`
