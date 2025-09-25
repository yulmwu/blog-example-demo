import { util } from '@aws-appsync/utils'

export const request = (ctx) => ({
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({ id: ctx.args.id }),
})

export const response = (ctx) => ctx.result
