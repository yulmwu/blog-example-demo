import {
    Controller,
    Get,
    Post as HttpPost,
    Put,
    Delete,
    Param,
    Body,
    Req,
} from '@nestjs/common'
import { PostsService } from './posts.service'
import { RequestWithSession } from 'src/types'
import { CreatePostDto } from './dto/create.dto'
import { UpdatePostDto } from './dto/update.dto'

@Controller('posts')
export class PostsController {
    constructor(private postsService: PostsService) {}

    @Get('health')
    healthCheck() {
        return { status: 'ok' }
    }

    @HttpPost()
    create(@Body() dto: CreatePostDto, @Req() req: RequestWithSession) {
        return this.postsService.create(dto, req.session.userId)
    }

    @Get()
    findAll() {
        return this.postsService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id)
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: RequestWithSession) {
        return this.postsService.update(id, dto, req.session.userId)
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Req() req: RequestWithSession) {
        return this.postsService.delete(id, req.session.userId)
    }
}
