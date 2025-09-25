import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Post } from './post.entity'
import { CreatePostDto } from './dto/create.dto'

@Injectable()
export class PostsService {
    constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

    async create(dto: CreatePostDto, authorId: string): Promise<Post> {
        const post = new this.postModel({ ...dto, authorId })
        return post.save()
    }

    async findAll(): Promise<Post[]> {
        return this.postModel.find().sort({ createdAt: -1 }).exec()
    }

    async findOne(id: string): Promise<Post> {
        const post = await this.postModel.findById(id).exec()
        if (!post) throw new NotFoundException('Post not found')
        return post
    }

    async update(id: string, updateData: Partial<Post>, userId: string): Promise<Post> {
        const post = await this.findOne(id)

        if (post.authorId.toString() !== userId) {
            throw new ForbiddenException('You are not the author of this post')
        }

        const updatedPost = await this.postModel.findByIdAndUpdate(id, updateData, { new: true }).exec()
        if (!updatedPost) throw new NotFoundException('Post not found')

        return updatedPost as Post
    }

    async delete(id: string, userId: string): Promise<void> {
        const post = await this.findOne(id)
        if (post.authorId.toString() !== userId) {
            throw new ForbiddenException('You are not the author of this post')
        }
        await this.postModel.findByIdAndDelete(id).exec()
    }
}
