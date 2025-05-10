import express from 'express';

import { createComment, getComments, deleteComment, getAllComments } from '../controllers/animeController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/comment', authMiddleware, createComment);
router.get('/comments', getAllComments); // Get all comments for the user
router.get('/comment/:animeId', getComments);
router.delete('/comment/:commentId', authMiddleware, deleteComment);

export default router;