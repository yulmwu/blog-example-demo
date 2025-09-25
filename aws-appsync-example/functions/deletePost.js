import { util } from '@aws-appsync/utils'

export const request = (ctx) => {
    const username = ctx.identity?.username
    if (!username) util.error('Unauthorized', 'Unauthorized')

    return {
        operation: 'DeleteItem',
        key: util.dynamodb.toMapValues({ id: ctx.args.id }),
        condition: {
            expression: '#author = :u',
            expressionNames: { '#author': 'author' },
            expressionValues: util.dynamodb.toMapValues({ ':u': username }),
        },
    }
}

export const response = (ctx) => {
    if (ctx.error) {
        const t = ctx.error.type || ''
        if (t.includes('ConditionalCheckFailedException')) {
            util.error('You are not the author of this post', 'Forbidden')
        }
        util.error(ctx.error.message, t)
    }
    return ctx.result
}
