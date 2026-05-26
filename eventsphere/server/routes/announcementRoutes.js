import express from 'express';
import { createAnnouncement, getAnnouncementsByEvent, getMyAnnouncementsFeed } from '../controllers/announcementsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get custom announcements feed (Participant/Volunteer/Organizer/Admin)
router.get('/my-feed', protect, getMyAnnouncementsFeed);

// Create an announcement for an event (Organizer/Admin)
router.post('/', protect, authorizeRoles('organizer', 'admin'), createAnnouncement);

// Get all announcements for a single event
router.get('/event/:eventId', protect, getAnnouncementsByEvent);

export default router;
