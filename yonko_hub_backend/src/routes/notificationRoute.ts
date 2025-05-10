import express from 'express';
import { getNotifications } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);

export default router;