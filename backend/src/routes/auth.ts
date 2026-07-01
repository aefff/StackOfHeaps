import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req: Request, res: Response): Promise<any> => {
    const pool: Pool = req.app.get('pool');
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

router.post('/login', async (req: Request, res: Response): Promise<any> => {
    const pool: Pool = req.app.get('pool');
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1;', [username]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );
        return res.status(200).json({ token });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete('/deleteAccount', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const pool: Pool = req.app.get('pool');
    const { username, password } = req.body;

    if (req.user?.username !== username) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE username = $1;', [username]);
        if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!isValid) return res.status(400).json({ error: "Incorrect password" });

        await pool.query('DELETE FROM users WHERE username = $1;', [username]);
        return res.status(200).json({ message: "Account deleted" });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;