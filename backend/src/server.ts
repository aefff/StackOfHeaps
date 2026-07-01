import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import {StorageHandler} from "./utils/storage.js";

dotenv.config();

const app = express();
app.use(express.json());

const storageHandler = new StorageHandler('./storage');
app.set('storageHandler', storageHandler);

const isTest = process.env.NODE_ENV === 'test';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: isTest ? Number(process.env.TEST_DB_PORT) : Number(process.env.DB_PORT),
    user: isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
    password: isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
    database: isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME,
});

app.set('pool', pool);

app.use('/api/projects', projectsRouter);

app.use('/api/auth', authRouter);

app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

export { app };