import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { Role, User } from './models';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function signJwt(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
    return token;
}

export function verifyJwt(token: string): { sub: string; email: string; role: Role } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: Role };
    } catch {
        return null;
    }
}

export function newId(): string {
    return nanoid(12);
}

export function newPublicId(): string {
    // short, URL-friendly public id
    return nanoid(10);
}
