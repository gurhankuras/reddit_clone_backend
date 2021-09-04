import config from 'config';
import { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

export default async function verifyToken(req: Request, res : Response, next: NextFunction) {
    const secret = config.get<string>('jwt_secret');
    const token = req.header('Authorization');
    if (!token) {
        return res.status(404).send({error: 'No Permission: Token not provided'});
    }
    try {
        const user = jwt.verify(token, secret);
        // @ts-ignore
        req.user = user;
        next();
    } catch (e) {
        // @ts-ignore
        return res.status(404).send({error: e.message || 'Token verification failed!'});
    }

}