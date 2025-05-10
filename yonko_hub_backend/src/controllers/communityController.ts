import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Community {
    name: string;
    description: string;
}

const checkAdmin = async (communityId: number, userId: number) => {
    const admin = await prisma.communityMembers.findFirst({
        where: {
            communityId,
            userId,
            Role: "ADMIN"
        }
    });
    return admin !== null;
}

const checkMember = async (communityId: number, userId: number) => {
    const member = await prisma.communityMembers.findFirst({
        where: {
            communityId,
            userId
        }
    });
    return member !== null;
}

export const createCommunity = async (req: Request, res: Response): Promise<void> => {

    const { name, description }: Community = req.body;

    if (!name || !description) {
        res.status(400).json({ message: "Name and Description are required" });
        return;
    }

    try {

        let coverImage = null;

        if (req.file) {
            coverImage = req.file.path;
        }

        const community = await prisma.community.create({
            data: {
                Name: name,
                Description: description,
                CoverImage: coverImage || "https://res.cloudinary.com/your-cloud-name/image/upload/v1/mugiwara_hub/community_covers/default-cover.jpg"
            }
        });

        if (community) {
            await prisma.communityMembers.create({
                data: {
                    communityId: community.id,
                    userId: req.user.id,
                    Role: "ADMIN"
                }
            })
        }
        res.status(201).json(community);
    } catch (error:any) {
        res.status(500).json({ message: "Error creating community" });
    }

};

export const joinCommunity = async (req: Request, res: Response): Promise<void> => {
    const { communityId } = req.body;

    const id = parseInt(communityId);

    if (!communityId) {
        res.status(400).json({ message: "Community ID is required" });
        return;
    }

    try {
        const community = await prisma.community.findUnique({
            where: {
                id
            }
        });

        if (!community) {
            res.status(404).json({ message: "Community not found" });
            return;
        }

        await prisma.communityMembers.create({
            data: {
                communityId: id,
                userId: req.user.id,
                Role: "MEMBER"
            }
        });

        res.status(201).json("Joined community successfully");
    } catch (error:any) {
        res.status(500).json({ message: "Error joining community" });
        console.error("Error joining community:", error);
    }
};

export const getCommunitues = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get communities the user is a member of
        const userCommunities = await prisma.communityMembers.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                community: true
            }
        });

        // 2. Get member counts for all communities
        const membersCount = await prisma.communityMembers.groupBy({
            by: ['communityId'],
            _count: {
                communityId: true
            }
        });

        // 3. Format the response properly
        const formattedCommunities = userCommunities.map((membership:any) => {
            const community = membership.community;
            const count = membersCount.find(m => m.communityId === community.id);

            return {
                ...community,
                membersCount: count?._count.communityId || 0
            };
        });

        res.status(200).json(formattedCommunities);
    } catch (error:any) {
        console.error("Error fetching communities:", error);
        res.status(500).json({ message: "Error fetching communities" });
    }
};

export const communityChat = async (req: Request, res: Response): Promise<void> => {
    const { communityId, message } = req.body;
    const userId = req.user.id;

    const checkMemberShip = await checkMember(parseInt(communityId), userId);
    if (!checkMemberShip) {
        res.status(403).json({ message: "You are not a member of this community" });
        return;
    }

    try {
        const community = await prisma.community.findUnique({
            where: {
                id: communityId
            }
        });
        if (!community) {
            res.status(404).json({ message: "Community not found" });
            return;
        }

        await prisma.communityChat.create({
            data: {
                communityId,
                userId,
                content: message
            }
        });

        res.status(201).json("Message sent");
    } catch (error) {
        res.status(500).json({ message: "Error sending message" });

    }

};

export const getCommunityChat = async (req: Request, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const ID = parseInt(communityId);

    const checkMemberShip = await checkMember(ID, req.user.id);
    if (!checkMemberShip) {
        res.status(403).json({ message: "You are not a member of this community" });
        return;
    }

    try {
        const chat = await prisma.communityChat.findMany({
            where: {
                communityId: ID
            },
            include: {
                user: true
            }
        });
        res.status(200).json(chat);
    } catch (error:any) {
        res.status(500).json({ message: "Error fetching community chat" });
    }
};

export const getCommunityById = async (req: Request, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const ID = parseInt(communityId);

    try {
        const community = await prisma.community.findUnique({
            where: {
                id: ID
            }
        });
        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: "Error fetching community" });
    }
};

export const getCommunityMembers = async (req: Request, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const ID = parseInt(communityId);

    try {
        const members = await prisma.communityMembers.findMany({
            where: {
                communityId: ID
            },
            include: {
                user: true
            }
        });
        const formattedMembers = members.map((member:any) => {
            return {
                id: member.user.id,
                username: member.user.name,
                profile: member.user.profile,
                role: member.Role
            };
        }
        );
        res.status(200).json(formattedMembers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching community members" });
    }
};

export const leaveCommunity = async (req: Request, res: Response): Promise<void> => {
    const { communityId } = req.params;
    const ID = parseInt(communityId);

    try {

        const community = await prisma.community.findUnique({
            where: {
                id: ID
            }
        });

        if (!community) {
            res.status(404).json({ message: "Community not found" });
            return;
        }

        const isAdmin = await checkAdmin(ID, req.user.id);
        if (isAdmin) {
            const adminCount = await prisma.communityMembers.count({
                where: {
                    communityId: ID,
                    Role: "ADMIN"
                }
            });
            if (adminCount <= 1) {
                res.status(400).json({ message: "You cannot leave the community as the last admin" });
                return;
            }
        }

        await prisma.communityMembers.deleteMany({
            where: {
                communityId: ID,
                userId: req.user.id
            }
        })

        res.status(200).json({
            message: "Left community successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Error leaving community" });
    }
};

export const KickMember = async (req: Request, res: Response): Promise<void> => {
    const { communityId, userId } = req.body;
    const UserID = parseInt(userId);

    try {

        const admin = await checkAdmin(parseInt(communityId), req.user.id);
        if (!admin) {
            res.status(403).json({ message: "You are not an admin of this community" });
            return;
        }

        const member = await prisma.communityMembers.findFirst({
            where: {
                communityId: parseInt(communityId),
                userId: UserID
            }
        });
        if (!member) {
            res.status(404).json({ message: "Member not found" });
            return;
        }

        await prisma.communityMembers.deleteMany({
            where: {
                communityId: parseInt(communityId),
                userId: UserID
            }
        })
        res.status(200).json("Member kicked successfully");


    } catch (error:any) {
        console.error("Error kicking member:", error);
        res.status(500).json({ message: "Error kicking member" });
    }

}

export const MakeAdmin = async (req: Request, res: Response): Promise<void> => {
    const { communityId, userId } = req.body;
    try {
        const admin = await checkAdmin(parseInt(communityId), req.user.id);
        if (!admin) {
            res.status(403).json({ message: "You are not an admin of this community" });
            return;
        }
        const member = await prisma.communityMembers.findFirst({
            where: {
                communityId: parseInt(communityId),
                userId: parseInt(userId)
            }
        });
        const checkMemIsAdmin = await checkAdmin(parseInt(communityId), parseInt(userId));
        if (checkMemIsAdmin) {
            res.status(400).json({ message: "User is already an admin" });
            return;
        }
        if (!member) {
            res.status(404).json({ message: "Member not found" });
            return;
        }
        await prisma.communityMembers.updateMany({
            where: {
                communityId: parseInt(communityId),
                userId: parseInt(userId)
            },
            data: {
                Role: "ADMIN"
            }
        });
        res.status(200).json("Member made admin successfully");

    } catch (error:any) {
        console.error("Error making admin:", error);
        res.status(500).json({ message: "Error making admin" });
    }

}

export const RemoveAdmin = async (req: Request, res: Response): Promise<void> => {
    const { communityId, userId } = req.body;
    try {
        const admin = await checkAdmin(parseInt(communityId), req.user.id);
        if (!admin) {
            res.status(403).json({ message: "You are not an admin of this community" });
            return;
        }
        const member = await prisma.communityMembers.findFirst({
            where: {
                communityId: parseInt(communityId),
                userId: parseInt(userId)
            }
        });
        const checkMemIsAdmin = await checkAdmin(parseInt(communityId), parseInt(userId));
        if (!checkMemIsAdmin) {
            res.status(400).json({ message: "User is not an admin" });
            return;
        }
        if (!member) {
            res.status(404).json({ message: "Member not found" });
            return;
        }
        await prisma.communityMembers.updateMany({
            where: {
                communityId: parseInt(communityId),
                userId: parseInt(userId)
            },
            data: {
                Role: "MEMBER"
            }
        });
        res.status(200).json("Member removed as admin successfully");

    } catch (error:any) {
        console.error("Error removing admin:", error);
        res.status(500).json({ message: "Error removing admin" });
    }

};

export const editCommunity = async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body;
    const communityId = parseInt(req.params.communityId);
    const userId = req.user.id;

    try {
        const isAdmin = await checkAdmin(communityId, userId);
        if (!isAdmin) {
            res.status(403).json({ message: "You are not admin you can't update community" });
            return;
        }
        let coverImage = null;
        if (req.file) {
            coverImage = req.file.path;
        }
        const updateData: any = {};
        if (name) updateData.Name = name;
        if (description) updateData.Description = description;
        if (coverImage) updateData.CoverImage = coverImage;

        await prisma.community.update({
            where: {
                id: communityId
            },
            data: updateData
        });
        res.status(200).json({
            message: "Community updated successfully"
        });

    } catch (error:any) {
        console.error("Error editing community:", error);
        res.status(500).json({ message: "Error editing community" });
    }
};