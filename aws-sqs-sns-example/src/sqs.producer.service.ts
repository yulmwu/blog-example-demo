import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

export interface SqsSendOptions {
    type?: string
    delaySeconds?: number
    groupId?: string
    deduplicationId?: string
    messageAttributes?: Record<string, SqsMessageAttribute>
}

export interface SqsMessageAttribute {
    DataType: 'String' | 'Number' | 'Binary'
    StringValue?: string
    BinaryValue?: Uint8Array
}

@Injectable()
export class SqsProducerService {
    private readonly logger = new Logger(SqsProducerService.name)

    private readonly client: SQSClient
    private readonly queueUrl: string

    constructor(private readonly config: ConfigService) {
        this.client = new SQSClient({
            region: this.config.get<string>('AWS_REGION'),
        })
        this.queueUrl = this.config.get<string>('SQS_QUEUE_URL', '')
    }

    async send(body: any, options?: SqsSendOptions): Promise<string | undefined> {
        const MessageBody = typeof body === 'string' ? body : JSON.stringify(body)

        const cmd = new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody,
            DelaySeconds: options?.delaySeconds ?? 0,
            MessageGroupId: options?.groupId,
            MessageDeduplicationId: options?.deduplicationId,
            MessageAttributes: options?.messageAttributes,
        })

        const res = await this.client.send(cmd)
        this.logger.debug(`Sent message: ${res.MessageId}`)

        return res.MessageId
    }
}
