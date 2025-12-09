import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils';
import { Role } from '../models';

export type AuthRequest<
    P = unknown,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = unknown
> = Request<P, ResBody, ReqBody, ReqQuery> & {
    user?: { id: string; email: string; role: Role };
};

export function jwtMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }
    const token = header.slice('Bearer '.length);
    const payload = verifyJwt(token);
    if (!payload) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    next();
}
