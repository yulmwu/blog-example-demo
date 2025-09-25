import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { badRequest, error, internalServerError, required, unAuthorized } from '../../utils/httpError'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const getNextId = async (): Promise<number> => {
    const command = new UpdateCommand({
        TableName: 'Counter',
        Key: { name: 'post' },
        UpdateExpression: 'SET #v = if_not_exists(#v, :init) + :inc',
        ExpressionAttributeNames: { '#v': 'value' },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':init': 0,
        },
        ReturnValues: 'UPDATED_NEW',
    })

    const result = await dynamoDB.send(command)
    return result.Attributes?.value
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
    try {
        const { title, content } = JSON.parse(event.body ?? '{}')
        if (!title || !content) return error(badRequest(required('title', 'content')), 'ERR_CREATE_POST_BAD_REQUEST')

        const user = event.requestContext.authorizer?.jwt?.claims
        if (!user || !user.sub || !user.username) return error(unAuthorized(), 'ERR_CREATE_POST_UNAUTHORIZED')

        const item = {
            id: String(await getNextId()),
            title,
            content,
            userId: user.sub,
            userName: user.username,
            createdAt: new Date().toISOString(),
        }

        const command = new PutCommand({
            TableName: 'Posts',
            Item: item,
        })

        await dynamoDB.send(command)

        return {
            statusCode: 201,
            body: JSON.stringify(item),
        }
    } catch (err) {
        return error(internalServerError((err as Error).message), 'ERR_CREATE_POST_INTERNAL_SERVER_ERROR')
    }
}
