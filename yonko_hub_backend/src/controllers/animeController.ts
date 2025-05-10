import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Comment {
    comment: string;
    userId: number;
    AnimeId: string;
}


export const createComment = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const { comment, AnimeId } = req.body as Comment;
    try {
        const Comment = await prisma.comment.create({
            data: {
                content:comment,
                userId,
                AnimeId
            }
        });
        res.status(201).json({ message: 'Comment created', Comment });
        
    } catch (error:any) {

        res.status(500).json({ message: 'Server error', error });
        
    }
};


export const getComments = async (req: Request, res: Response): Promise<void> => {
    const animeId = req.params.animeId;
    try {
        const comments = await prisma.comment.findMany({
            where: {
                AnimeId: animeId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        profile: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ comments });
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const commentId = Number(req.params.commentId);

    try {
        const comment = await prisma.comment.findFirst({
            where:{
                id:commentId
            }
        });
        if(!comment){
            res.status(404).json({message:'Comment not found'});
            return;
        }
        if(comment.userId !== userId){
            res.status(401).json({message:'Unauthorized'});
            return;
        }
        await prisma.comment.delete({
            where:{
                id:commentId
            }
        });
        res.status(200).json({message:'Comment deleted'});
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
        
    }

};

export const getAllComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const comments = await prisma.comment.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        profile: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ comments });
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
    }
}