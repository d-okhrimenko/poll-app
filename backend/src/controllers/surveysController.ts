import { Request, Response } from 'express';
import { z } from 'zod';
import { readDb, writeDb } from '../db';
import { AuthRequest } from '../middleware/auth';
import { newId, newPublicId } from '../utils';

const CreateSurveySchema = z.object({
    question: z.string().min(5).max(300),
    options: z.array(z.string().min(1).max(100)).min(2).max(10),
});

const UpdateSurveySchema = z.object({
    question: z.string().min(5).max(300),
    options: z.array(z.union([
        z.object({
            id: z.string().optional(), // існуюча опція з ID
            text: z.string().min(1).max(100)
        }),
        z.string().min(1).max(100) // нова опція (тільки текст)
    ])).min(2).max(10),
});

const VoteSchema = z.object({
    optionId: z.string().min(1),
});

export async function listSurveysAdmin(req: AuthRequest, res: Response): Promise<void> {
    const db = await readDb();
    const stats = db.surveys.map(s => {
        const votes = db.votes.filter(v => v.surveyId === s.id);
        return {
            id: s.id,
            question: s.question,
            createdAt: s.createdAt,
            publicId: s.publicId,
            totalVotes: votes.length,
        };
    });
    res.json(stats);
}

export async function createSurvey(req: AuthRequest<unknown, unknown, { question: string; options: string[] }>, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const parsed = CreateSurveySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { question, options } = parsed.data;
    const db = await readDb();
    const survey = {
        id: newId(),
        question,
        options: options.map((text: string) => ({ id: newId(), text })),
        publicId: newPublicId(),
        createdByUserId: req.user.id,
        createdAt: new Date().toISOString(),
    };
    db.surveys.push(survey);
    await writeDb(db);
    res.status(201).json(survey);
}

export async function getSurveyAdmin(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    const { id } = req.params;
    const db = await readDb();
    const survey = db.surveys.find(s => s.id === id);
    if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
    const votes = db.votes.filter(v => v.surveyId === survey.id);
    const optionCounts = new Map<string, number>();
    for (const o of survey.options) optionCounts.set(o.id, 0);
    for (const v of votes) optionCounts.set(v.optionId, (optionCounts.get(v.optionId) ?? 0) + 1);
    const options = survey.options.map(o => ({ id: o.id, text: o.text, votes: optionCounts.get(o.id) ?? 0 }));
    res.json({ ...survey, totalVotes: votes.length, options });
}

export async function getSurveyPublic(req: Request, res: Response): Promise<void> {
    const { publicId } = req.params as { publicId: string };
    const db = await readDb();
    const survey = db.surveys.find(s => s.publicId === publicId);
    if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
    res.json({ id: survey.id, question: survey.question, options: survey.options, publicId: survey.publicId });
}

export async function votePublic(
    req: AuthRequest<{ publicId: string }, unknown, { optionId: string }>,
    res: Response
): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { publicId } = req.params;
    const parsed = VoteSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    const { optionId } = parsed.data;
    const db = await readDb();
    const survey = db.surveys.find(s => s.publicId === publicId);
    if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
    const hasVoted = db.votes.some(v => v.surveyId === survey.id && v.userId === req.user!.id);
    if (hasVoted) { res.status(409).json({ error: 'User already voted' }); return; }
    const optionExists = survey.options.some(o => o.id === optionId);
    if (!optionExists) { res.status(400).json({ error: 'Invalid optionId' }); return; }
    db.votes.push({ id: newId(), surveyId: survey.id, userId: req.user.id, optionId, createdAt: new Date().toISOString() });
    await writeDb(db);
    res.status(201).json({ ok: true });
}

export async function resultsPublic(req: Request, res: Response): Promise<void> {
    const { publicId } = req.params as { publicId: string };
    const db = await readDb();
    const survey = db.surveys.find(s => s.publicId === publicId);
    if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
    const votes = db.votes.filter(v => v.surveyId === survey.id);
    const totalVotes = votes.length;
    const counts = new Map<string, number>();
    for (const o of survey.options) counts.set(o.id, 0);
    for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);
    const list = survey.options.map(o => {
        const c = counts.get(o.id) ?? 0;
        const percentage = totalVotes === 0 ? 0 : Math.round((c / totalVotes) * 100);
        return { optionId: o.id, text: o.text, votesCount: c, percentage };
    });
    res.json({ surveyId: survey.id, publicId: survey.publicId, question: survey.question, totalVotes, options: list });
}

export async function getUserCompletedSurveys(req: AuthRequest<{ userId: string }>, res: Response): Promise<void> {
    const { userId } = req.params;
    const db = await readDb();
    
    // Перевірка чи існує користувач
    const user = db.users.find(u => u.id === userId);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    
    // Знаходимо всі голоси користувача
    const userVotes = db.votes.filter(v => v.userId === userId);
    
    // Знаходимо опитування за ID голосів
    const completedSurveys = userVotes.map(vote => {
        const survey = db.surveys.find(s => s.id === vote.surveyId);
        if (!survey) return null;
        
        const selectedOption = survey.options.find(o => o.id === vote.optionId);
        
        return {
            surveyId: survey.id,
            publicId: survey.publicId,
            question: survey.question,
            completedAt: vote.createdAt,
            selectedOption: selectedOption ? {
                id: selectedOption.id,
                text: selectedOption.text
            } : null
        };
    }).filter(Boolean); // Видаляємо null значення
    
    res.json({
        userId,
        userEmail: user.email,
        totalCompletedSurveys: completedSurveys.length,
        surveys: completedSurveys
    });
}

export async function getMyCompletedSurveys(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    const db = await readDb();
    
    // Знаходимо всі голоси поточного користувача
    const userVotes = db.votes.filter(v => v.userId === req.user!.id);
    
    // Знаходимо опитування за ID голосів
    const completedSurveys = userVotes.map(vote => {
        const survey = db.surveys.find(s => s.id === vote.surveyId);
        if (!survey) return null;
        
        const selectedOption = survey.options.find(o => o.id === vote.optionId);
        
        return {
            surveyId: survey.id,
            publicId: survey.publicId,
            question: survey.question,
            completedAt: vote.createdAt,
            selectedOption: selectedOption ? {
                id: selectedOption.id,
                text: selectedOption.text
            } : null
        };
    }).filter(Boolean); // Видаляємо null значення
    
    res.json({
        userId: req.user!.id,
        userEmail: req.user!.email,
        totalCompletedSurveys: completedSurveys.length,
        surveys: completedSurveys
    });
}

export async function listSurveysUser(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    const db = await readDb();
    
    // Отримуємо всі опитування з інформацією про те, чи проголосував користувач
    const surveysWithStatus = db.surveys.map(survey => {
        const userVote = db.votes.find(v => v.surveyId === survey.id && v.userId === req.user!.id);
        const totalVotes = db.votes.filter(v => v.surveyId === survey.id).length;
        
        return {
            id: survey.id,
            publicId: survey.publicId,
            question: survey.question,
            createdAt: survey.createdAt,
            totalVotes,
            hasVoted: !!userVote,
            votedAt: userVote?.createdAt || null
        };
    });
    
    res.json(surveysWithStatus);
}

export async function updateSurvey(req: AuthRequest<{ id: string }, unknown, { question: string; options: string[] }>, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    
    const { id } = req.params;
    const parsed = UpdateSurveySchema.safeParse(req.body);
    
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    
    const { question, options } = parsed.data;
    const db = await readDb();
    
    // Перевіряємо, чи існує опитування
    const surveyIndex = db.surveys.findIndex(s => s.id === id);
    if (surveyIndex === -1) {
        res.status(404).json({ error: 'Survey not found' });
        return;
    }
    
    const survey = db.surveys[surveyIndex];
    
    // Перевіряємо, чи є голоси в цьому опитуванні
    const existingVotes = db.votes.filter(v => v.surveyId === id);
    if (existingVotes.length > 0) {
        res.status(409).json({ 
            error: 'Cannot modify survey with existing votes',
            message: 'Неможливо змінити опитування, в якому вже є голоси',
            totalVotes: existingVotes.length
        });
        return;
    }
    
    // Обробляємо опції: зберігаємо існуючі ID або створюємо нові
    const processedOptions = options.map((option: any) => {
        if (typeof option === 'string') {
            // Нова опція - створюємо новий ID
            return { id: newId(), text: option };
        } else {
            // Існуюча або нова опція з об'єктом
            return {
                id: option.id || newId(), // використовуємо існуючий ID або створюємо новий
                text: option.text
            };
        }
    });
    
    // Оновлюємо опитування
    const updatedSurvey = {
        id: survey!.id,
        question,
        options: processedOptions,
        publicId: survey!.publicId,
        createdByUserId: survey!.createdByUserId,
        createdAt: survey!.createdAt
    };
    
    db.surveys[surveyIndex] = updatedSurvey;
    await writeDb(db);
    
    res.json(updatedSurvey);
}

export async function deleteSurvey(req: AuthRequest<{ id: string }>, res: Response): Promise<void> {
    if (!req.user || req.user.role !== 'admin') { res.status(403).json({ error: 'Forbidden' }); return; }
    const { id } = req.params;
    const db = await readDb();
    const idx = db.surveys.findIndex(s => s.id === id);
    if (idx === -1) { res.status(404).json({ error: 'Survey not found' }); return; }
    const removed = db.surveys[idx];
    db.surveys.splice(idx, 1);
    db.votes = db.votes.filter(v => v.surveyId !== removed!.id);
    await writeDb(db);
    res.status(204).send();
}
