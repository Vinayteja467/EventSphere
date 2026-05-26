import express from 'express';
import { getLeaderboard, updateTaskStatus } from '../controllers/volunteersController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Publicly viewable leaderboard
router.get('/leaderboard', getLeaderboard);

// Toggle/update status of a specific task (Volunteer only)
router.patch('/tasks/:taskId', protect, authorizeRoles('volunteer'), updateTaskStatus);

export default router;
