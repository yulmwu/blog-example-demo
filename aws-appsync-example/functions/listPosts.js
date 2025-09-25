export const request = () => ({ operation: 'Scan' })

export const response = (ctx) => ctx.result.items
