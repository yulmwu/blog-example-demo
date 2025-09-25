import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SQSClient } from '@aws-sdk/client-sqs'
import { Consumer } from 'sqs-consumer'

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SqsConsumerService.name)

    private consumer!: Consumer
    private client: SQSClient
    private queueUrl: string

    constructor(private readonly config: ConfigService) {
        this.client = new SQSClient({
            region: this.config.get<string>('AWS_REGION'),
        })
        this.queueUrl = this.config.get<string>('SQS_QUEUE_URL', '')
    }

    onModuleInit() {
        this.consumer = Consumer.create({
            queueUrl: this.queueUrl,
            sqs: this.client,
            batchSize: 10,
            waitTimeSeconds: 20,
            visibilityTimeout: 10,
            messageAttributeNames: ['All'],
            messageSystemAttributeNames: ['ApproximateReceiveCount'],
            handleMessage: async (message) => {
                const body = this.safeParse(message.Body)

                const ok = await this.dispatch(body, { sqsMessageAttributes: message.MessageAttributes })
                if (!ok) {
                    throw new Error(
                        `Message handling failed (ReceiveCount: ${message.Attributes?.ApproximateReceiveCount})`,
                    )
                }
            },
        })

        this.consumer.on('error', (err) => this.logger.error(`Consumer error: ${err.message}`, err.stack))
        this.consumer.on('processing_error', (err) => this.logger.error(`Processing error: ${err.message}`, err.stack))
        this.consumer.on('message_received', (m) => this.logger.debug(`Received: ${m.MessageId}`))
        this.consumer.on('message_processed', (m) => this.logger.debug(`Processed: ${m.MessageId}`))

        this.consumer.start()
        this.logger.log('SQS consumer started')
    }

    async onModuleDestroy() {
        if (this.consumer) {
            this.consumer.stop()
            this.logger.log('SQS consumer stopped')
        }
    }

    private safeParse(raw?: string) {
        if (!raw) return undefined
        try {
            return JSON.parse(raw)
        } catch {
            return raw
        }
    }

    private async dispatch(payload: any, meta?: any): Promise<boolean> {
        try {
            const parsedPayloadBody = this.jsonParse(payload?.Message)

            switch (parsedPayloadBody?.type || payload?.type) {
                case 'order.created':
                    this.logger.log('[order.created]', payload, meta)
                    break
                case 'throw.error':
                    throw new Error('Test error')
                default:
                    this.logger.log('[message]', payload, meta)
            }
            return true
        } catch (e: any) {
            this.logger.error('dispatch error: ' + e?.message)
            return false
        }
    }

    private jsonParse(raw?: string): any {
        if (!raw) return undefined
        try {
            return JSON.parse(raw)
        } catch {
            return raw
        }
    }
}
