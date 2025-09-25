import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyResultV2 } from 'aws-lambda'
import { error, internalServerError } from '../../utils/httpError'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
    try {
        const command = new ScanCommand({ TableName: 'Posts' })
        const result = await dynamoDB.send(command)

        return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_GET_POSTS_INTERNAL_SERVER_ERROR')
    }
}
