import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    NotAuthorizedException,
    InvalidParameterException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { error, internalServerError, unAuthorized } from '../../utils/httpError'

const client = new CognitoIdentityProviderClient({ region: 'ap-northeast-2' })

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const cookies = event.cookies ?? []
        const refreshToken = cookies.find((c) => c.startsWith('refreshToken='))?.split('=')[1]

        if (!refreshToken) return error(unAuthorized(), 'ERR_REFRESH_UNAUTHORIZED')

        const command = new InitiateAuthCommand({
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
        })

        const response = await client.send(command)

        return {
            statusCode: 200,
            body: JSON.stringify({
                accessToken: response.AuthenticationResult?.AccessToken,
                idToken: response.AuthenticationResult?.IdToken,
                expiresIn: response.AuthenticationResult?.ExpiresIn,
            }),
        }
    } catch (err) {
        if (err instanceof NotAuthorizedException) {
            return error(unAuthorized(), 'ERR_REFRESH_INVALID_TOKEN')
        } else if (err instanceof InvalidParameterException) {
            return error(unAuthorized(), 'ERR_REFRESH_INVALID_PARAMETER')
        } else if (err instanceof UserNotFoundException) {
            return error(unAuthorized(), 'ERR_REFRESH_USER_NOT_FOUND')
        }

        return error(internalServerError((err as Error).message), 'ERR_REFRESH_INTERNAL_SERVER_ERROR')
    }
}
