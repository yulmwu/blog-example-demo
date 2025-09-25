import { util } from '@aws-appsync/utils'

export const request = (ctx) => {
    const username = ctx.identity?.username
    if (!username) util.error('Unauthorized', 'Unauthorized')

    const sets = []
    const names = {}
    const values = {}

    if (ctx.args.title !== undefined) {
        sets.push('#title = :title')
        names['#title'] = 'title'
        values[':title'] = ctx.args.title
    }
    if (ctx.args.content !== undefined) {
        sets.push('#content = :content')
        names['#content'] = 'content'
        values[':content'] = ctx.args.content
    }
    if (sets.length === 0) util.error('Nothing to update', 'BadRequest')

    return {
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({ id: ctx.args.id }),
        update: {
            expression: `SET ${sets.join(', ')}`,
            expressionNames: names,
            expressionValues: util.dynamodb.toMapValues(values),
        },
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
