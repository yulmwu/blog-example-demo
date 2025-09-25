import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, forbidden, internalServerError, notFound, unAuthorized } from '../../utils/httpError'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
    try {
        const id = event.pathParameters?.id
        if (!id) return error(badRequest('Missing id parameter'), 'ERR_DELETE_POST_BAD_REQUEST_MISSING_ID')

        const user = event.requestContext.authorizer?.jwt?.claims
        if (!user || !user.sub || !user.username) return error(unAuthorized(), 'ERR_DELETE_POST_UNAUTHORIZED')

        const getCommand = new GetCommand({
            TableName: 'Posts',
            Key: { id },
        })

        const result = await dynamoDB.send(getCommand)
        if (!result.Item) return error(notFound('Not found post'), 'ERR_DELETE_POST_NOT_FOUND')

        if (result.Item.userId !== user.sub)
            return error(forbidden('You do not have permission to delete this post'), 'ERR_DELETE_POST_FORBIDDEN')

        const deleteCommand = new DeleteCommand({
            TableName: 'Posts',
            Key: { id },
        })

        await dynamoDB.send(deleteCommand)

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Post deleted successfully' }),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_DELETE_POST_INTERNAL_SERVER_ERROR')
    }
}
