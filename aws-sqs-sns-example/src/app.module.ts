import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { ConfigModule } from '@nestjs/config'
import { SqsProducerService } from './sqs.producer.service'
import { SqsConsumerService } from './sqs.consumer.service'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
    ],
    providers: [SqsProducerService, SqsConsumerService],
    controllers: [MessagesController],
})
export class AppModule {}
