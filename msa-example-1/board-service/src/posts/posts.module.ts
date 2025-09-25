import { Module, MiddlewareConsumer } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PostsService } from './posts.service'
import { PostsController } from './posts.controller'
import { Post, PostSchema } from './post.entity'
import { SessionAuthMiddleware } from '../middleware/session-auth.middleware'

@Module({
    imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
    controllers: [PostsController],
    providers: [PostsService],
})
export class PostsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(SessionAuthMiddleware).forRoutes('posts')
    }
}
