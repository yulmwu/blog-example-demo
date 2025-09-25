export interface Session {
    userId: string
}

export interface RequestWithSession extends Request {
    session: Session
}
