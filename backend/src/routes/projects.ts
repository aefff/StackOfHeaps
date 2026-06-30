import express, { Response } from 'express';
import * as fs from 'fs';
import { Pool } from 'pg';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const { projectName, stackId, rawStackData } = req.body;

    if (!projectName || !stackId || !rawStackData) {
        return res.status(400).json({ error: "Missing projectName, stackId, or rawStackData" });
    }

    const filePath = `./storage/stack_${stackId}.json`;
    const pool: Pool = req.app.get('pool');

    try {
        await fs.promises.mkdir('./storage', { recursive: true });
        await fs.promises.writeFile(filePath, JSON.stringify(rawStackData, null, 2), "utf8");

        const result = await pool.query(
            `INSERT INTO projects (project_name, user_id, file_path) 
             VALUES ($1, $2, $3) RETURNING *;`,
            [projectName, req.user!.id, filePath]
        );

        return res.status(201).json({
            message: "Project created and stack saved successfully",
            project: result.rows[0]
        });

    } catch (error: any) {
        console.error("Project creation error:", error.message);
        if (error.code === '23505') {
            return res.status(409).json({ error: "File path or project conflict already exists." });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/:id/stream', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const pool: Pool = req.app.get('pool');

    try {
        const projectCheck = await pool.query(
            'SELECT file_path FROM projects WHERE id = $1 AND user_id = $2;',
            [req.params.id, req.user!.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found or unauthorized access" });
        }

        const targetFilePath = projectCheck.rows[0].file_path;

        res.setHeader('Content-Type', 'application/json');

        const fileStream = fs.createReadStream(targetFilePath);

        fileStream.on('error', (err: any) => {
            console.error("Disk stream read failure:", err.message);
            if (!res.headersSent) {
                res.status(404).json({ error: "Physical stack record file missing on disk" });
            }
        });

        fileStream.pipe(res);

    } catch (error: any) {
        console.error("Stream initialization error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;