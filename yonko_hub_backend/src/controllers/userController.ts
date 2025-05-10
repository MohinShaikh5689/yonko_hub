import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken";

const prisma = new PrismaClient();

interface LoginRequest {
    email: string;
    password: string;
}

interface SignupRequest extends LoginRequest {
    name: string;
}

interface SearchRequest {
    name: string;
}

const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email }
    });
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await findUserByEmail(email);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        const token = generateToken(user.id);
        res.status(200).json({
            message: "Login successful",
            user: {
                Id : user.id,
                name: user.name,
                email: user.email,
                token,
                isLoggedIn: true,
                profile: user.profile
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, gender }: SignupRequest & { gender?: string } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: "Email already registered" });
            return;
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                gender: gender || 'unspecified',
                profile: 'https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg'

            }
        });

        const token = generateToken(newUser.id);
        res.status(201).json({
            message: "Registration successful",
            user: {
                name: newUser.name,
                email: newUser.email,
                token,
                isLoggedIn: true
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getUsers = async(req: Request, res: Response): Promise<void> => {
    try {
        // Get all users excluding the current user
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: req.user.id
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile: true,
                createdAt: true,
            }
        });
        
        // Shuffle the users array
        const shuffledUsers = users.sort(() => 0.5 - Math.random());
        
        // Take only the first 10 users (or less if there aren't 10)
        const randomUsers = shuffledUsers.slice(0, 10);
        
        res.status(200).json(randomUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error", error });
    }
}

export const getMe = async(req: Request, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile: true,
                createdAt: true,
                gender: true,
            }
        });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const searchUsers = async(req: Request, res: Response): Promise<void> => {
    const { name }:SearchRequest = req.body;
    try{
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: name,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile: true,
            }
        });

        const filteredUsers = users.filter(user => user.id !== req.user.id);

        if(filteredUsers.length === 0){
            res.status(404).json({ message: "No users found" });
            return;
        }
        res.status(200).json(filteredUsers);

    }catch(error:any){
        res.status(500).json({ message: "Server error", error });
    }
};

export const getUSerByID = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    try {
        const user = await prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                name: true,
                email: true,
                profile: true,
                createdAt: true,
                
            }
        });
    
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
    
        const isFriend = await prisma.friend.findFirst({
            where:{
                OR:[
                    {senderId: userId, receiverId: id},
                    {senderId: id, receiverId: userId}
                ]
            },select:{
                status: true
            }
        });
    
        res.status(200).json({
            user,
            isFriend
        });
    } catch (error:any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, newPassword } = req.body;
    const userId = req.user.id;
    
    try {
       
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        
        
        let profilePath = null;
        if (req.file) {
            profilePath = req.file.path;
        }
        
        
        const updateData: any = {};
        
    
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (profilePath) updateData.profile = profilePath;
        
       
        if (password && newPassword) {
           
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                res.status(401).json({ message: "Current password is incorrect" });
                return;
            }
            
            
            updateData.password = await bcrypt.hash(newPassword, 10);
        }
        

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: "No data provided for update" });
            return;
        }
        
       
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                profile: true,
                createdAt: true
            }
        });
        
        
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            res.status(409).json({ 
                message: "Email already in use by another account" 
            });
            return;
        }
        
        res.status(500).json({ 
            message: "Server error while updating profile",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
