import { util } from '@aws-appsync/utils'

export const request = (ctx) => {
    const username = ctx.identity?.username
    if (!username) util.error('Unauthorized', 'Unauthorized')

    const id = util.autoId()
    const now = util.time.nowISO8601()

    return {
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ id }),
        attributeValues: util.dynamodb.toMapValues({
            title: ctx.args.title,
            content: ctx.args.content,
            author: username,
            createdAt: now,
        }),
        condition: { expression: 'attribute_not_exists(id)' },
    }
}

export const response = (ctx) => ctx.result
