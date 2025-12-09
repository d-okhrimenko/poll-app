import express from 'express';
// @ts-ignore
import cors from 'cors';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { surveyRouter } from './routes/surveyRoutes';
import { readDb, writeDb } from './db';
import { hashPassword, newId, newPublicId } from './utils';
// @ts-ignore
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const app = express();

app.use(cors({ origin: ['http://localhost:4200', 'http://localhost:5173'], credentials: false }));
app.use(express.json());

// Swagger UI and JSON
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/surveys', surveyRouter);

async function seedInitialData(): Promise<void> {
    const db = await readDb();

    // If already populated (admin + 3+ surveys + 10+ users + some votes), skip seeding
    const hasAdmin = db.users.some(u => u.role === 'admin');
    const hasEnoughUsers = db.users.filter(u => u.role === 'user').length >= 10;
    const hasEnoughSurveys = db.surveys.length >= 3;
    const hasAnyVotes = db.votes.length > 0;
    if (hasAdmin && hasEnoughUsers && hasEnoughSurveys && hasAnyVotes) {
        return;
    }

    // Admin
    const adminEmail = 'admin@example.com';
    let admin = db.users.find(u => u.email.toLowerCase() === adminEmail);
    if (!admin) {
        const adminPasswordHash = await hashPassword('Admin123!');
        admin = { id: newId(), email: adminEmail, passwordHash: adminPasswordHash, role: 'admin', createdAt: new Date().toISOString() };
        db.users.push(admin);
        // eslint-disable-next-line no-console
        console.log('Seeded admin user admin@example.com / Admin123!');
    }

    // 10 users
    for (let i = 1; i <= 10; i++) {
        const email = `user${i}@example.com`;
        const exists = db.users.some(u => u.email.toLowerCase() === email);
        if (!exists) {
            const passwordHash = await hashPassword(`User${i}123!`);
            db.users.push({ id: newId(), email, passwordHash, role: 'user', createdAt: new Date().toISOString() });
        }
    }

    // 3 Angular-themed surveys
    const angularSurveys = [
        {
            question: 'Яку версію Angular ви зараз використовуєте?',
            options: ['v14', 'v15', 'v16', 'v17+'],
        },
        {
            question: 'Який підхід до стану ви надаєте перевагу в Angular?',
            options: ['RxJS services', 'NgRx', 'Component Store', 'Signals'],
        },
        {
            question: 'Який рендеринг ви використовуєте для продакшену?',
            options: ['CSR', 'SSR (Angular Universal)', 'SSG/Prerender', 'Hybrid'],
        },
    ];

    const hasAnyAngularSurvey = db.surveys.some(s => angularSurveys.some(a => a.question === s.question));
    if (!hasAnyAngularSurvey) {
        for (const s of angularSurveys) {
            const surveyId = newId();
            db.surveys.push({
                id: surveyId,
                question: s.question,
                options: s.options.map(text => ({ id: newId(), text })),
                publicId: newPublicId(),
                createdByUserId: admin!.id,
                createdAt: new Date().toISOString(),
            });
        }
        // eslint-disable-next-line no-console
        console.log('Seeded 3 Angular-themed surveys');
    }

    // Seed votes from users for each survey (1 vote per user per survey)
    const userIds = db.users.filter(u => u.role === 'user').map(u => u.id);
    for (const survey of db.surveys) {
        for (const userId of userIds) {
            const already = db.votes.some(v => v.surveyId === survey.id && v.userId === userId);
            if (already) continue;
            if (survey.options.length === 0) continue;
            const randomOption = survey.options[Math.floor(Math.random() * survey.options.length)];
            db.votes.push({ id: newId(), surveyId: survey.id, userId, optionId: randomOption!.id, createdAt: new Date().toISOString() });
        }
    }

    await writeDb(db);
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

seedInitialData().then(() => {
    app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`API listening on http://localhost:${PORT}`);
        console.log(`Swager on http://localhost:${PORT}/api-docs`);
    });
});
