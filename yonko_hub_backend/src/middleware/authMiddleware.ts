import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';

// JWT payload interface
interface JwtPayload {
    id: number;
}

declare global {
    namespace Express {
        interface Request {
            user: User;
        }
    }
}

const prisma = new PrismaClient();

export const authMiddleware = async (
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!process.env.JWT_SECRET) {
            res.status(500).json({ message: 'JWT secret not configured' });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        
        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        res.status(500).json({ message: 'Server error' });
        return;
    }
};