import {
    CognitoIdentityProviderClient,
    ConfirmSignUpCommand,
    CodeMismatchException,
    ExpiredCodeException,
    UserNotFoundException,
    NotAuthorizedException,
    TooManyFailedAttemptsException,
} from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, internalServerError, required } from '../../utils/httpError'

const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { username, code } = JSON.parse(event.body ?? '{}')
        if (!username || !code) return error(badRequest(required('username', 'code')), 'ERR_CONFIRM_EMAIL_BAD_REQUEST')

        const command = new ConfirmSignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: username,
            ConfirmationCode: code,
        })

        await cognitoClient.send(command)

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email confirmation successful' }),
        }
    } catch (err) {
        if (err instanceof CodeMismatchException) {
            return error(badRequest('Invalid confirmation code'), 'ERR_CONFIRM_EMAIL_CODE_MISMATCH')
        } else if (err instanceof ExpiredCodeException) {
            return error(badRequest('Confirmation code has expired'), 'ERR_CONFIRM_EMAIL_EXPIRED_CODE')
        } else if (err instanceof UserNotFoundException) {
            return error(badRequest('User does not exist'), 'ERR_CONFIRM_EMAIL_USER_NOT_FOUND')
        } else if (err instanceof NotAuthorizedException) {
            return error(badRequest('User is already confirmed'), 'ERR_CONFIRM_EMAIL_ALREADY_CONFIRMED')
        } else if (err instanceof TooManyFailedAttemptsException) {
            return error(badRequest('Too many failed confirmation attempts'), 'ERR_CONFIRM_EMAIL_TOO_MANY_ATTEMPTS')
        }

        return error(internalServerError((err as Error).message), 'ERR_CONFIRM_EMAIL_INTERNAL_SERVER_ERROR')
    }
}
