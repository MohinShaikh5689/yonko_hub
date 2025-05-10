import express from 'express';

import { addWatchlist, checkWatchlist, getWatchlist, deleteFromWatchlist, getRecommendation  } from '../controllers/watchlistController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/',authMiddleware,getWatchlist);
router.post('/add',authMiddleware,addWatchlist);
router.post('/check',authMiddleware,checkWatchlist);
router.delete('/delete',authMiddleware,deleteFromWatchlist);
router.get('/recommendation',authMiddleware,getRecommendation);
router.get('/:id',authMiddleware,getWatchlist);


export default router;