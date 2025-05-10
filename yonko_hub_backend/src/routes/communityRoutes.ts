import express from 'express';
import { createCommunity, getCommunitues, communityChat, getCommunityChat, getCommunityById, getCommunityMembers, joinCommunity, leaveCommunity, KickMember, MakeAdmin, RemoveAdmin, editCommunity } from '../controllers/communityController';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadCommunity } from '../utils/CloudinaryConfig';

const router = express.Router();

router.post('/create', authMiddleware, uploadCommunity.single('coverImage'), createCommunity);
router.post('/chat', authMiddleware, communityChat);
router.get('/',authMiddleware, getCommunitues);
router.post('/join', authMiddleware, joinCommunity);
router.get('/:communityId', authMiddleware, getCommunityById);
router.get('/chat/:communityId', authMiddleware, getCommunityChat);
router.get('/members/:communityId', authMiddleware, getCommunityMembers);
router.delete('/leave/:communityId', authMiddleware, leaveCommunity);
router.post('/kick', authMiddleware, KickMember);
router.post('/make-admin', authMiddleware, MakeAdmin);
router.post('/remove-admin', authMiddleware, RemoveAdmin);
router.put('/edit/:communityId', authMiddleware, uploadCommunity.single('coverImage'), editCommunity);

export default router;