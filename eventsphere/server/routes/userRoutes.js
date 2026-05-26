import express from 'express';
import { getProfile, updateProfile, getUsers, updateUserRole } from '../controllers/usersController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Admin-only user management
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);

export default router;
