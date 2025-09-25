import {
    CognitoIdentityProviderClient,
    ResendConfirmationCodeCommand,
    UserNotFoundException,
    InvalidParameterException,
    LimitExceededException,
    NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, internalServerError, required } from '../../utils/httpError'

const cognitoClient = new CognitoIdentityProviderClient({})

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const { username } = JSON.parse(event.body ?? '{}')
        if (!username) return error(badRequest(required('username')), 'ERR_RESEND_EMAIL_BAD_REQUEST')

        const command = new ResendConfirmationCodeCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: username,
        })

        await cognitoClient.send(command)

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully resent confirmation code' }),
        }
    } catch (err) {
        if (err instanceof UserNotFoundException) {
            return error(badRequest('User does not exist'), 'ERR_RESEND_EMAIL_USER_NOT_FOUND')
        } else if (err instanceof InvalidParameterException) {
            return error(badRequest('Invalid request parameter'), 'ERR_RESEND_EMAIL_INVALID_PARAMETER')
        } else if (err instanceof LimitExceededException) {
            return error(
                badRequest('Attempt limit exceeded. Please try again later.'),
                'ERR_RESEND_EMAIL_LIMIT_EXCEEDED'
            )
        } else if (err instanceof NotAuthorizedException) {
            return error(badRequest('User is already confirmed'), 'ERR_RESEND_EMAIL_ALREADY_CONFIRMED')
        }

        return error(internalServerError((err as Error).message), 'ERR_RESEND_EMAIL_INTERNAL_SERVER_ERROR')
    }
}
