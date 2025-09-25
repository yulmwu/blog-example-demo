import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from './user.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

    async register(username: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new this.userModel({ username, password: hashedPassword })
        await user.save()
    }

    async login(username: string, password: string, session: any): Promise<void> {
        const user = await this.userModel.findOne({ username })

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials')
        }
        session.userId = user._id
    }

    async logout(session: any): Promise<void> {
        return new Promise((resolve, reject) => {
            session.destroy((err) => {
                if (err) return reject(err)
                resolve()
            })
        })
    }

    async getMe(userId: string) {
        return this.userModel.findById(userId).select('-password')
    }
}
