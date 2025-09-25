import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, internalServerError, notFound } from '../../utils/httpError'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id
        if (!id) return error(badRequest('Missing id parameter'), 'ERR_GET_POST_BAD_REQUEST_MISSING_ID')

        const command = new GetCommand({
            TableName: 'Posts',
            Key: { id },
        })

        const result = await dynamoDB.send(command)
        if (!result.Item) return error(notFound('Not found post'), 'ERR_GET_POST_NOT_FOUND')

        return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_GET_POST_INTERNAL_SERVER_ERROR')
    }
}
