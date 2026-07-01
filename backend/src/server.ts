import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import projectsRouter from './routes/projects.js';

dotenv.config();

const app = express();
app.use(express.json());

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

app.get('/api/test', (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
});

app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing fields" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username;',
            [username, hashedPassword]
        );
        return res.status(201).json({ user: result.rows[0] });
    } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: "Username taken" });
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1;', [username]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
        return res.status(200).json({ token });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete('/api/auth/deleteAccount', async (req: Request, res: Response): Promise<any> => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(' ')[1];
    const { username, password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { username: string };
        if (decoded.username !== username) return res.status(403).json({ error: "Forbidden" });

        const result = await pool.query('SELECT password_hash FROM users WHERE username = $1;', [username]);
        if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!isValid) return res.status(400).json({ error: "Incorrect password" });

        await pool.query('DELETE FROM users WHERE username = $1;', [username]);
        return res.status(200).json({ message: "Account deleted" });
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});