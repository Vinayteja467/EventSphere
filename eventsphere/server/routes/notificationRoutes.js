import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  clearNotifications,
  triggerAIChecks
} from '../controllers/notificationsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/clear', clearNotifications);
router.post('/trigger-ai-checks', triggerAIChecks);

export default router;
