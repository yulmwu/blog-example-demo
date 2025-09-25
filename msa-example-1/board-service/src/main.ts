import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as session from 'express-session'
import * as redis from 'redis'
import * as express from 'express'
import { RedisStore } from 'connect-redis'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

async function getSecret(): Promise<Record<string, string>> {
    const client = new SecretsManagerClient({
        region: process.env.AWS_REGION,
    })

    const command = new GetSecretValueCommand({ SecretId: process.env.SESSION_SECRET_NAME })
    const response = await client.send(command)

    if (!response.SecretString) {
        throw new Error('SecretString not found')
    }

    return JSON.parse(response.SecretString)
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const redisClient = redis.createClient({
        url: process.env.REDIS_URL!,
        socket: {
            tls: true,
            rejectUnauthorized: false
        }
    })

    redisClient.on('error', (err) => {
        console.error('Redis error:', err)
    })

    redisClient.on('connect', () => {
        console.log('Connected to Redis')
    })

    await redisClient.connect()

    const secret = await getSecret()

    app.use(
        session({
            store: new RedisStore({ client: redisClient }),
            secret: secret['session_secret_key'],
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false,
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24, // 1 day
            },
        })
    )

    app.use(express.json())

    await app.listen(process.env.PORT ?? 3000)
    console.log(`Posts service running on http://localhost:${process.env.PORT ?? 3000}`)
}

bootstrap()
