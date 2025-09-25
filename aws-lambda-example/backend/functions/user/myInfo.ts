import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { error, internalServerError, unAuthorized } from '../../utils/httpError'

const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const authHeader = event.headers?.Authorization ?? event.headers?.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) return error(unAuthorized(), 'ERR_GET_USER_UNAUTHORIZED')

        const accessToken = authHeader.substring('Bearer '.length)

        const getUserCommand = new GetUserCommand({ AccessToken: accessToken })
        const result = await cognitoClient.send(getUserCommand)

        const userAttributes = Object.fromEntries((result.UserAttributes ?? []).map((attr) => [attr.Name, attr.Value]))

        return {
            statusCode: 200,
            body: JSON.stringify({
                username: result.Username,
                ...userAttributes,
            }),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_GET_USER_INTERNAL_SERVER_ERROR')
    }
}
