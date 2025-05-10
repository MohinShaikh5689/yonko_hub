import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface FriendRequest {
    senderId: number;  // Changed from userId
    receiverId: number;  // Changed from friendId
}

export const addFriend = async (req: Request<{}, {}, FriendRequest>, res: Response): Promise<void> => {
    const senderId = req.user.id;
    const receiverId = Number(req.body.receiverId);
   
    try {
        const checkFriendship = await prisma.friend.findFirst({
            where: {
                senderId,
                receiverId
            }
        });

        if (checkFriendship) {
            res.status(400).json({ message: 'Friendship request already exists' });
            return;
        }

        const newFriendship = await prisma.friend.create({
            data: {
                senderId,
                receiverId,
                status: 'PENDING'  // Added to match schema default
            }
        });
        
        await prisma.notification.create({
            data:{
                userId: receiverId,
                content: `${req.user.name} sent you a friend request`,
            }
        });
        
        res.status(201).json({
            message: 'Friendship request sent',
            friendship: newFriendship
        });
        console.log('Friendship request sent');
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getFriends = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    try {
        const friend = await prisma.friend.findMany({
            where:{
                OR:[
                    {senderId: userId},
                    {receiverId: userId}
                ],
                status: 'ACCEPTED'
            },
            include: {
                sender: {
                    select:{
                        id: true,
                        name: true,
                        email: true,
                        profile: true,
                        
                    }
                },
                receiver: {
                    select:{
                        id: true,
                        name: true,
                        email: true,
                        profile: true,
                       
                    }
                }
            }
        });

        const formattedFriends = friend.map((fri:any)=>{
            if(fri.senderId === userId){
                return {...fri.receiver,friendshipCreatedAt: fri.createdAt};
            }else{
                return {...fri.sender,friendshipCreatedAt: fri.createdAt};
            }
        });

        res.status(200).json(formattedFriends);
        
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getFriendRequests = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    try {
        const friendRequests = await prisma.friend.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profile: true,
                    }
                }
            }
        });

        res.status(200).json(friendRequests);
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const handleFriendRequest = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const friendId = Number(req.body.friendId);
    const status = req.body.status;

    try {
        const checkFriendship = await prisma.friend.findFirst({
            where: {
                senderId: friendId,
                receiverId: userId
            }
        });

        if (!checkFriendship) {
            res.status(400).json({ message: 'Friendship request not found' });
            return;
        }

        if (status === 'REJECTED') {
            await prisma.friend.delete({
                where: {
                    id: checkFriendship.id
                }
            });

            await prisma.notification.create({
                data:{
                    userId: friendId,
                    content: `${req.user.name} rejected your friend request`,
                }
            });

            res.status(200).json({ message: 'Friendship request rejected' });
            return;

        }

        const updatedFriendship = await prisma.friend.update({
            where: {
                id: checkFriendship.id
            },
            data: {
                status: status
            }
        });
        
        await prisma.notification.create({
            data:{
                userId: friendId,
                content: `${req.user.name} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your friend request`,
            }
        });

        res.status(200).json({
            message: 'Friendship request accepted',
            friendship: updatedFriendship
        });
    } catch (error:any) {
        console.log(error);
        res.status(500).json({ message: 'Server error', error });
    }
};