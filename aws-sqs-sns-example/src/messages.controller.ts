import { Body, Controller, Post } from '@nestjs/common'
import { SqsProducerService } from './sqs.producer.service'

interface SendMessageDto {
    body: object
    type?: string
    delaySeconds?: number
    groupId?: string
    deduplicationId?: string
}

@Controller('messages')
export class MessagesController {
    constructor(private readonly sqs: SqsProducerService) {}

    @Post()
    async send(@Body() dto: SendMessageDto) {
        const id = await this.sqs.send(dto.body, {
            delaySeconds: dto.delaySeconds,
            groupId: dto.groupId,
            deduplicationId: dto.deduplicationId,
        })

        return { id }
    }
}
