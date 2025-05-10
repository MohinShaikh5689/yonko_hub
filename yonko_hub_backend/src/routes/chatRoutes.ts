import express from 'express';

import { sendMessage, getMessages, getAllTheChattedUsers } from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/send', authMiddleware ,sendMessage);
router.post('/' , authMiddleware ,getMessages);
router.get('/chatted-users', authMiddleware ,getAllTheChattedUsers);

export default router;