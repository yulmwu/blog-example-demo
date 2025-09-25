import { CognitoIdentityProviderClient, GlobalSignOutCommand } from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { error, internalServerError, unAuthorized } from '../../utils/httpError'

const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const authHeader = event.headers?.Authorization ?? event.headers?.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) return error(unAuthorized(), 'ERR_LOGOUT_UNAUTHORIZED')

        const accessToken = authHeader.substring('Bearer '.length)

        const command = new GlobalSignOutCommand({ AccessToken: accessToken })
        await cognitoClient.send(command)

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure',
            },
            body: JSON.stringify({ message: 'Logged out successfully' }),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_LOGOUT_INTERNAL_SERVER_ERROR')
    }
}
