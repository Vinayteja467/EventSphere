import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, authorizeRoles('organizer', 'admin'), createEvent);

router.route('/:id')
  .put(protect, authorizeRoles('organizer', 'admin'), updateEvent)
  .delete(protect, authorizeRoles('organizer', 'admin'), deleteEvent);

export default router;
