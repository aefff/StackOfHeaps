import express, { Response } from 'express';
import { Pool } from 'pg';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { StorageHandler } from '../utils/storage.js';
import { HeapStack } from '../utils/stack.js';

const router = express.Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const pool: Pool = req.app.get('pool');

    try {
        const result = await pool.query(
            'SELECT id, project_name, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC;',
            [req.user!.id]
        );

        return res.status(200).json({ projects: result.rows });
    } catch (error: any) {
        console.error("Fetch projects list error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    const { projectName, stackId, rawStackData } = req.body;

    if (!projectName || !stackId || !rawStackData) {
        return res.status(400).json({ error: "Missing projectName, stackId, or rawStackData" });
    }

    const pool: Pool = req.app.get('pool');
    const storageHandler: StorageHandler = req.app.get('storageHandler');

    try {
        const stackInstance = HeapStack.fromRawStack({
            id: stackId,
            ...rawStackData
        });

        await storageHandler.storeNewRecord(stackInstance, req.user!.username);

        const filePath = storageHandler.getFilePath(stackId);

        const result = await pool.query(
            `INSERT INTO projects (project_name, user_id, file_path) 
             VALUES ($1, $2, $3) RETURNING id, project_name, file_path, created_at;`,
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
    const storageHandler: StorageHandler = req.app.get('storageHandler');

    try {
        const projectCheck = await pool.query(
            'SELECT file_path FROM projects WHERE id = $1 AND user_id = $2;',
            [req.params.id, req.user!.id]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ error: "Project not found or unauthorized access" });
        }

        const targetFilePath = projectCheck.rows[0].file_path;

        const stackId = targetFilePath
            .replace(/^.*stack_/, '')
            .replace(/\.json$/, '');

        const loadedStack = await storageHandler.retrieveRecord(stackId, req.user!.username);

        return res.status(200).json(loadedStack.exportRawStack());

    } catch (error: any) {
        console.error("Stream initialization error:", error.message);
        if (error.message && error.message.includes("Record not found")) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;