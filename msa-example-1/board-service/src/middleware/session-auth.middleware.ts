import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

export interface Session {
    userId: string
}

export interface RequestWithSession extends Request {
    session: Session
}

@Injectable()
export class SessionAuthMiddleware implements NestMiddleware {
    use(req: RequestWithSession, _: Response, next: NextFunction) {
        if (!req.session || !req.session.userId) {
            throw new UnauthorizedException('Not authenticated')
        }
        next()
    }
}
