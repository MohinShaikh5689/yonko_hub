import {  Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(notifications);
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
}