import { Request, Response } from 'express';
import { z } from 'zod';
import { readDb, writeDb } from '../db';
import { newId } from '../utils';
import { hashPassword, signJwt, verifyPassword } from '../utils';

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

export async function register(req: Request, res: Response): Promise<void> {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { email, password } = parsed.data;
    const db = await readDb();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        res.status(409).json({ error: 'Email already registered' });
        return;
    }
    const passwordHash = await hashPassword(password);
    const user = {
        id: newId(),
        email,
        passwordHash,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDb(db);
    const token = signJwt({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { email, password } = parsed.data;
    const db = await readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const token = signJwt({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}
