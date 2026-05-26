import express from 'express';
import { registerParticipant, markAttendance, getMyRegistrations } from '../controllers/registrationsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Get current user's registrations (tickets)
router.get('/my', protect, getMyRegistrations);

// Register for an event (Participant or Admin)
router.post('/', protect, authorizeRoles('participant', 'admin'), registerParticipant);

// Check-in via QR scan (Volunteer, Organizer, Admin)
router.patch('/:id/attendance', protect, authorizeRoles('volunteer', 'organizer', 'admin'), markAttendance);

export default router;
