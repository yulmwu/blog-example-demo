import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    NotAuthorizedException,
    PasswordResetRequiredException,
    UserNotConfirmedException,
    UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, internalServerError, required } from '../../utils/httpError'

const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { username, password } = JSON.parse(event.body ?? '{}')
        if (!username || !password) return error(badRequest(required('username', 'password')), 'ERR_LOGIN_BAD_REQUEST')

        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        })

        const result = await cognitoClient.send(command)

        const accessToken = result.AuthenticationResult?.AccessToken
        const idToken = result.AuthenticationResult?.IdToken
        const refreshToken = result.AuthenticationResult?.RefreshToken

        const maxAge = 30 * 24 * 60 * 60 // 30 days

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=None; Secure`,
            },
            body: JSON.stringify({
                accessToken,
                idToken,
            }),
        }
    } catch (err) {
        if (err instanceof NotAuthorizedException)
            return error(badRequest('Invalid username or password'), 'ERR_LOGIN_INVALID_CREDENTIALS')
        else if (err instanceof UserNotConfirmedException)
            return error(
                badRequest('User is not confirmed. Please confirm your email first.'),
                'ERR_LOGIN_USER_NOT_CONFIRMED'
            )
        else if (err instanceof PasswordResetRequiredException)
            return error(
                badRequest('Password reset is required. Please reset your password.'),
                'ERR_LOGIN_PASSWORD_RESET_REQUIRED'
            )
        else if (err instanceof UserNotFoundException)
            return error(badRequest('User not found. Please check your username.'), 'ERR_LOGIN_USER_NOT_FOUND')
        else return error(internalServerError((err as Error).message), 'ERR_LOGIN_INTERNAL_SERVER_ERROR')
    }
}
