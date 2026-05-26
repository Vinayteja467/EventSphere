import express from 'express';
import { matchSponsors } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Match sponsors (Organizer, Sponsor, or Admin only)
router.post('/sponsor-match', protect, authorizeRoles('organizer', 'sponsor', 'admin'), matchSponsors);

export default router;
