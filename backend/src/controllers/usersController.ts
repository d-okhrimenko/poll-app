import { Response } from 'express';
import { z } from 'zod';
import { readDb, writeDb } from '../db';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils';

const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(50).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'),
});

export async function me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const db = await readDb();
    const user = db.users.find(u => u.id === req.user!.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    // Participation history
    const votes = db.votes.filter(v => v.userId === user.id);
    const surveysMap = new Map(db.surveys.map(s => [s.id, s] as const));
    const history = votes.map(v => {
        const survey = surveysMap.get(v.surveyId);
        return survey ? {
            surveyId: survey.id,
            question: survey.question,
            publicId: survey.publicId,
            chosenOptionId: v.optionId,
            votedAt: v.createdAt,
        } : null;
    }).filter(Boolean);
    res.json({ id: user.id, email: user.email, role: user.role, history });
}

export async function changePassword(req: AuthRequest<unknown, unknown, { currentPassword: string; newPassword: string }>, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    
    const { currentPassword, newPassword } = parsed.data;
    const db = await readDb();
    
    // Знаходимо користувача в базі даних
    const user = db.users.find(u => u.id === req.user!.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    
    // Перевіряємо поточний пароль
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
        res.status(400).json({ error: 'Current password is incorrect', message: 'Поточний пароль невірний' });
        return;
    }
    
    // Перевіряємо, чи новий пароль не співпадає з поточним
    if (currentPassword === newPassword) {
        res.status(400).json({ error: 'New password must be different from current password', message: 'Новий пароль має відрізнятися від поточного' });
        return;
    }
    
    // Гешуємо новий пароль і оновлюємо користувача
    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    await writeDb(db);
    
    res.json({ 
        message: 'Пароль успішно змінено',
        success: true
    });
}
