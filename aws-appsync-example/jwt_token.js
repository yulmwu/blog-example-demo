import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider'
import { createHmac } from 'crypto'

const CLIENT_ID = '..'
const CLIENT_SECRET_KEY = '..'

const clientSecretHashGenerator = (username, clientId, clientSecretKey) => {
    const hmac = createHmac('sha256', clientSecretKey)
    hmac.update(username + clientId)

    return hmac.digest('base64')
}

const cognitoClient = new CognitoIdentityProviderClient()

const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
        USERNAME: '..',
        PASSWORD: '...',
        SECRET_HASH: clientSecretHashGenerator('..', CLIENT_ID, CLIENT_SECRET_KEY),
    },
})

const result = await cognitoClient.send(command)

console.log(result.AuthenticationResult?.AccessToken)
