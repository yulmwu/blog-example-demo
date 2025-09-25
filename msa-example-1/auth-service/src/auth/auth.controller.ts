import { Controller, Post, Body, Req, Res, Get } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { RequestWithSession } from 'src/types'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Get('health')
    healthCheck() {
        return { status: 'ok' }
    }

    @Post('register')
    async register(@Body() body: RegisterDto, @Res() res: Response) {
        try {
            await this.authService.register(body.username, body.password)
            res.status(201).send('User registered')
        } catch (err) {
            res.status(400).send(err.message)
        }
    }

    @Post('login')
    async login(@Body() body: LoginDto, @Req() req: RequestWithSession, @Res() res: Response) {
        try {
            await this.authService.login(body.username, body.password, req.session)
            res.send('Logged in')
        } catch (err) {
            res.status(401).send(err.message)
        }
    }

    @Post('logout')
    async logout(@Req() req: RequestWithSession, @Res() res: Response) {
        try {
            await this.authService.logout(req.session)
            res.send('Logged out')
        } catch (err) {
            res.status(500).send('Could not log out.')
        }
    }

    @Get('me')
    async getMe(@Req() req: RequestWithSession, @Res() res: Response) {
        if (!req.session.userId) {
            return res.status(401).send('Not authenticated')
        }

        try {
            const user = await this.authService.getMe(req.session.userId)
            res.json(user)
        } catch (err) {
            res.status(500).send(err.message)
        }
    }
}
