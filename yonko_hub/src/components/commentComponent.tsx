import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface Comment {
    id: number;
    userId: number;
    content: string;
    createdAt: string;
    user: {
        name: string;
        profile: string;
    }
}

interface CommentSectionProps {
    animeId: string;
    token: string | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ animeId, token }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [_myUserId, setMyUserId] = useState<number | null>(null);
    const commentsRef = useRef<HTMLDivElement>(null);

    // Add comment function
    const addComment = async () => {
        if (!commentText.trim() || !token) return;

        setSubmittingComment(true);
        try {
            await axios.post('http://localhost:3001/api/anime/comment', {
                comment: commentText,
                AnimeId: animeId,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Clear the comment text
            setCommentText("");

            // Fetch all comments and filter on client side
            fetchComments();
        } catch (error: any) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    // Fetch comments
    const fetchComments = async () => {
        setIsLoadingComments(true);
        try {
            const response = await axios.get(`http://localhost:3001/api/anime/comment/${animeId}`);

            if (response.data.comments) {
                const allComments = response.data.comments;

                // For now, just display all comments - we'll filter by episode later if needed
                const formattedComments = allComments.map((comment: any) => ({
                    id: comment.id,
                    userId: comment.userId,
                    content: comment.content,
                    user: {
                        name: comment.user?.name || "Anonymous",
                        profile: comment.user?.profile || "",
                    },
                    createdAt: comment.createdAt,
                }));

                setComments(formattedComments);
            }
        } catch (error: any) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    useEffect(() => {
        // Get user ID from local storage
        const userId = localStorage.getItem('userId');
        if (userId) {
            setMyUserId(parseInt(userId));
        }

        // Fetch comments when component mounts
        if (animeId) {
            fetchComments();
        }
    }, [animeId]);

    return (
        <motion.div
            ref={commentsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12"
        >
            <div className="backdrop-blur-lg rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl mb-8">
                <div className="bg-gradient-to-r from-indigo-800/30 via-purple-700/30 to-indigo-800/30 p-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div>
                        <h2 className="text-lg font-medium text-white">Episode Comments</h2>
                    </div>
                    <div className="text-sm text-indigo-300">
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </div>
                </div>

                <div className="p-5 bg-indigo-900/20">
                    {/* Comment form */}
                    <div className="mb-6 relative">
                        <Textarea
                            placeholder="Share your thoughts about this episode..."
                            className="w-full bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-indigo-100 placeholder:text-indigo-300/50 focus:border-indigo-400 focus:ring focus:ring-indigo-500/20 resize-none"
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            disabled={!token || submittingComment}
                        />
                        <div className="mt-3 flex justify-end">
                            <Button
                                className={`px-6 ${commentText.trim() && !submittingComment
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                                    : 'bg-indigo-700/50 cursor-not-allowed'}`}
                                disabled={!commentText.trim() || submittingComment}
                                onClick={addComment}
                            >
                                {submittingComment ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                )}
                                Post Comment
                            </Button>
                        </div>
                        {!token && (
                            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                <div className="text-center">
                                    <p className="text-indigo-200 mb-3">Login to join the conversation</p>
                                    <Link href="/login">
                                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                            Sign In / Register
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments list */}
                    <div className="space-y-5">
                        {isLoadingComments ? (
                            // Loading state for comments
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex animate-pulse">
                                    <div className="flex-shrink-0 mr-4">
                                        <div className="h-10 w-10 rounded-full bg-indigo-500/20"></div>
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <div className="h-4 bg-indigo-500/20 rounded w-1/4"></div>
                                        <div className="h-3 bg-indigo-500/20 rounded w-3/4"></div>
                                        <div className="h-3 bg-indigo-500/20 rounded w-2/3"></div>
                                    </div>
                                </div>
                            ))
                        ) : comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/20">
                                    <div className="flex">
                                        <div className="flex-shrink-0 mr-4">
                                            <Avatar className="h-10 w-10 border-2 border-indigo-500/30">
                                                <AvatarImage src={comment.user.profile || "https://i.pinimg.com/736x/9f/c5/cf/9fc5cf14dc2fdefaacf70d52a12415b3.jpg"} alt={comment.user.name} />
                                                <AvatarFallback className="bg-indigo-800/70 text-indigo-200">
                                                    {comment.user.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between mb-2">
                                                <Link href={`/visit/${comment.userId}`} className="font-medium text-indigo-100 hover:text-white transition-colors">
                                                    {comment.user.name}
                                                </Link>
                                                <span className="text-xs text-indigo-400/70">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-indigo-200 mb-3 break-words">
                                                {comment.content}
                                            </p>
                                            <div className="flex items-center text-sm text-indigo-400">

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 border border-indigo-500/10 rounded-xl bg-indigo-950/20">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
                                    <svg className="w-8 h-8 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No comments yet</h3>
                                <p className="text-indigo-300/70 max-w-md mx-auto mb-4">
                                    Be the first to share your thoughts about this episode!
                                </p>
                            </div>
                        )}
                    </div>
                    {/* Floating button to jump to comments when deeper down the page */}
                    <button
                        onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-full shadow-lg shadow-indigo-900/40 lg:hidden"
                    >

                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CommentSection;