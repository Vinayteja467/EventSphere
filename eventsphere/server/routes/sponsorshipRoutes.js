import express from 'express';
import { 
  createSponsorshipOffer, 
  getSponsorStats, 
  getOrganizerSponsorships, 
  updateSponsorshipStatus 
} from '../controllers/sponsorshipController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mount endpoints
router.post('/offer', protect, createSponsorshipOffer);
router.get('/stats', protect, getSponsorStats);

// Organizer sponsorship management routes
router.get('/organizer', protect, getOrganizerSponsorships);
router.patch('/:id/status', protect, updateSponsorshipStatus);

export default router;
