import { promises as fs } from 'fs';
import { resolve } from 'path';
import { DatabaseSchema } from './models';

const dataDir = resolve(process.cwd(), 'data');
const dbFile = resolve(dataDir, 'db.json');

let writeQueue = Promise.resolve();

async function ensureFile(): Promise<void> {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.access(dbFile);
    } catch (_) {
        const empty: DatabaseSchema = { users: [], surveys: [], votes: [] };
        await fs.writeFile(dbFile, JSON.stringify(empty, null, 2), 'utf8');
    }
}

export async function readDb(): Promise<DatabaseSchema> {
    await ensureFile();
    const data = await fs.readFile(dbFile, 'utf8');
    return JSON.parse(data) as DatabaseSchema;
}

export async function writeDb(next: DatabaseSchema): Promise<void> {
    await ensureFile();
    // serialize writes to avoid races
    writeQueue = writeQueue.then(async () => {
        const tmp = dbFile + '.tmp';
        await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
        await fs.rename(tmp, dbFile);
    });
    return writeQueue;
}
