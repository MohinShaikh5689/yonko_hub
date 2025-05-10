import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;
    const receiver = Number(receiverId);


    try {
        const checkReceiver = await prisma.user.findUnique({
            where: { id: receiver }
        });

        if (!checkReceiver) {
            res.status(404).json({ message: 'Receiver not found' });
            return;
        }

        const newMessage = await prisma.directMessage.create({
            data: {
                senderId,
                receiverId: receiver,
                content,
            }
        });

        res.status(201).json(newMessage);
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { receiverId } = req.body;
    const receiver = Number(receiverId);
    
    try {
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: receiver },
                    { senderId: receiver, receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    
        res.status(200).json(messages);
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
    }
   
};

export const getAllTheChattedUsers = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    
    try {
        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            select: {
                senderId: true,
                receiverId: true,
                content: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profile: true, // Include profile if available
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profile: true, // Include profile if available
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        // Create a map to store unique users with their last message
        const userMap = new Map();
        
        // Process each message to extract the other user (not the current user)
        messages.forEach((message) => {
            // Determine if the other user is the sender or receiver
            const otherUser = message.senderId === userId ? message.receiver : message.sender;
            const otherUserId = otherUser.id;
            
            // Only add if this user hasn't been added yet, or if this message is more recent
            if (!userMap.has(otherUserId) || message.createdAt > userMap.get(otherUserId).lastMessageTime) {
                
                userMap.set(otherUserId, {
                    id: otherUser.id,
                    name: otherUser.name,
                    profile: otherUser.profile,
                    lastMessage: message.content,
                });
            }
        });
        
        // Convert map to array of chat users
        const uniqueUsers = Array.from(userMap.values());
        
        // Sort by most recent message
        uniqueUsers.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        
        res.status(200).json(uniqueUsers);
    } catch (error:any) {
        res.status(500).json({ 
            message: 'Server error while fetching chat users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};