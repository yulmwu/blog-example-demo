import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class Post extends Document {
    @Prop({ required: true })
    title: string

    @Prop({ required: true })
    content: string

    @Prop({ type: Types.ObjectId, required: true })
    authorId: Types.ObjectId
}

export const PostSchema = SchemaFactory.createForClass(Post)
