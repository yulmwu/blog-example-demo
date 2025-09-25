import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, forbidden, internalServerError, notFound, required, unAuthorized } from '../../utils/httpError'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id
        if (!id) return error(badRequest('Missing id parameter'), 'ERR_UPDATE_POST_BAD_REQUEST_MISSING_ID')

        const { title, content } = JSON.parse(event.body ?? '{}')
        if (!title || !content) return error(badRequest(required('title', 'content')), 'ERR_UPDATE_POST_BAD_REQUEST')

        const user = event.requestContext.authorizer?.jwt?.claims
        if (!user) return error(unAuthorized(), 'ERR_UPDATE_POST_UNAUTHORIZED')

        const getCommand = new GetCommand({
            TableName: 'Posts',
            Key: { id },
        })

        const result = await dynamoDB.send(getCommand)
        if (!result.Item) return error(notFound('Not found post'), 'ERR_UPDATE_POST_NOT_FOUND')

        if (result.Item.userId !== user.sub)
            return error(forbidden('You do not have permission to update this post'), 'ERR_UPDATE_POST_FORBIDDEN')

        const updateCommand = new UpdateCommand({
            TableName: 'Posts',
            Key: { id },
            UpdateExpression: 'SET #t = :t, #c = :c',
            ExpressionAttributeNames: {
                '#t': 'title',
                '#c': 'content',
            },
            ExpressionAttributeValues: {
                ':t': title,
                ':c': content,
            },
            ReturnValues: 'ALL_NEW',
        })

        const updated = await dynamoDB.send(updateCommand)

        return {
            statusCode: 200,
            body: JSON.stringify(updated.Attributes),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_UPDATE_POST_INTERNAL_SERVER_ERROR')
    }
}
