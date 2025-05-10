import express from 'express';
import { uploadProfile } from '../utils/CloudinaryConfig';
import { login, getUsers, signup, getMe, searchUsers, getUSerByID, updateUserProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.put('/update',authMiddleware ,uploadProfile.single('profile'), updateUserProfile);
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.get('/',authMiddleware ,getUsers);
router.get('/me',authMiddleware ,getMe);
router.post('/search',authMiddleware ,searchUsers);
router.get('/:id',authMiddleware ,getUSerByID);


export default router;

