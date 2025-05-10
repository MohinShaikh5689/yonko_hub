import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from "axios";
import { console } from "inspector";

const prisma = new PrismaClient();

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID; // Your Custom Search Engine ID
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Your Google API Key                  

interface WatchlistRequest {
    AnimeId: number;
    English_Title: string;
    Japanese_Title: string;
    Image_url: string;
    synopsis: string;
}



export const addWatchlist = async (req: Request, res: Response): Promise<void> => {
    const watchlist: WatchlistRequest = req.body;
    const userId = req.user.id;
    try {
        const checkWatchlist = await prisma.watchList.findFirst({
            where: {
                userId: userId,
                AnimeId: watchlist.AnimeId
            }
        });

        if (checkWatchlist) {
            res.status(400).json({ message: 'Anime already in watchlist' });
            return;
        }

        const newWatchlist = await prisma.watchList.create({
            data: {
                AnimeId: watchlist.AnimeId,
                English_Title: watchlist.English_Title,
                Japanese_Title: watchlist.Japanese_Title,
                Image_url: watchlist.Image_url,
                synopsis: watchlist.synopsis,
                userId: userId,
            }
        });

        res.status(201).json({
            message: 'Anime added to watchlist',
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const checkWatchlist = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const AnimeId = Number(req.body.AnimeId);
    try {
        const watchlist = await prisma.watchList.findFirst({
            where: {
                userId: userId,
                AnimeId
            }
        });
        if (!AnimeId) {
            res.status(400).json({ message: 'AnimeId is required' });
            return;
        }

        if (watchlist) {
            res.status(200).json({
                response: true,
            });
        } else {
            res.status(200).json({
                response: false,
            });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getWatchlist = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const userID = req.params.id;
    try {
        if (userID) {
            const watchlist = await prisma.watchList.findMany({
                where: {
                    userId: Number(userID)
                }
            });
            res.status(200).json(watchlist);
            return;
        }

        const watchlist = await prisma.watchList.findMany({
            where: {
                userId: userId
            }
        });

        res.status(200).json(watchlist);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteFromWatchlist = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;
    const AnimeId = Number(req.body.AnimeId);
    try {


        const checkWatchlist = await prisma.watchList.findFirst({
            where: {
                userId: userId,
                AnimeId
            }
        });
        if (!checkWatchlist) {
            res.status(404).json({ message: 'Anime not found in watchlist' });
            return;
        } else {
            await prisma.watchList.delete({
                where: {
                    id: checkWatchlist.id
                }
            });
            res.status(200).json({ message: 'Anime removed from watchlist' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const fetchImages = async (anime: string) => {
    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                q: `${anime} official anime poster`,
                searchType: "image",
                cx: GOOGLE_CSE_ID,
                key: GOOGLE_API_KEY,
                num: 1
            }
        });
        const imageUrl = response.data.items?.[0]?.link || "/images/default-anime-placeholder.png";
        return imageUrl;
    } catch (error: any) {
        console.error('Error fetching images:', error);
    }
};

export const getRecommendation = async (req: Request, res: Response): Promise<void> => {
    try {
        let prompt = `You are an anime recommendation system, recommend 9 anime.
        Return ONLY a valid JSON array of objects with these exact properties: 
        [
            {
                "title": "English title",
                "japanese_title": "Japanese title",
                "synopsis": "Brief synopsis"
            }
        ]`;

        const userId = Number(req.user.id);
        const watchlist = await prisma.watchList.findMany({
            where: { userId: userId },
            select: { English_Title: true }
        });

        const animeList = watchlist.map((anime: any) => anime.English_Title).join(', ');

        if (watchlist.length > 0) {
            prompt = `You are an anime recommendation system. Based on these anime: ${animeList}, recommend 9 similar anime.
            Return ONLY a valid JSON array of objects with these exact properties: 
            [
                {
                    "title": "English title",
                    "japanese_title": "Japanese title",
                    "synopsis": "Brief synopsis"
                }
            ]`;
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        // Extract the response correctly
        if (!result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Failed to generate content');
        }
        const text = result.response.candidates[0].content.parts[0].text;

        // More thorough cleanup of the JSON text
        let cleanedText = text
            .replace(/^```json\s*|\s*```$/g, '') // Remove markdown code block syntax
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .trim(); // Remove leading/trailing whitespace

        let recommendations;
        try {
            // Parse JSON response with error handling
            recommendations = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);

            // Try an alternative approach - sometimes there are hidden characters
            try {
                // Try to extract just the array part using regex
                const jsonMatch = cleanedText.match(/\[\s*\{.*\}\s*\]/s);
                if (jsonMatch) {
                    recommendations = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Could not extract JSON array');
                }
            } catch (secondError) {
                throw new Error('Failed to parse recommendation data after multiple attempts');
            }
        }

        // Fetch images for each recommendation
        for (let i = 0; i < recommendations.length; i++) {
            const anime = recommendations[i];
            const imageUrl = await fetchImages(anime.title);
            recommendations[i].image_url = imageUrl;
        }

        // Structure the final response
        const MergedData = recommendations.map((anime: any) => ({
            English_Title: anime.title,
            Japanese_Title: anime.japanese_title,
            Image_url: anime.image_url,
            synopsis: anime.synopsis
        }));
        res.status(200).json(MergedData);

    } catch (error: any) {
        console.error('Recommendation error:', error);
        res.status(500).json({
            message: 'Error generating recommendations',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
