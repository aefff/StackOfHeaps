import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized. Token missing or malformed." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        const parsedId = decoded.userId || decoded.id;

        req.user = {
            id: Number(parsedId),
            username: decoded.username
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}