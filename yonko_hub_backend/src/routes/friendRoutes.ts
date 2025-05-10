import express from 'express';
import { addFriend, getFriends, getFriendRequests, handleFriendRequest } from '../controllers/friendController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/add', authMiddleware, addFriend);
router.get('/list', authMiddleware, getFriends);
router.get('/requests', authMiddleware, getFriendRequests);
router.post('/request', authMiddleware, handleFriendRequest);

export default router;