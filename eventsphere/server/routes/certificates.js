import express from 'express';
import {
  generateBulk,
  manualOverride,
  getEventCertificates,
  getMyCertificates,
  downloadPDF,
  verifyPublicCertificate
} from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public Verification Endpoint
router.get('/verify/:certificateId', verifyPublicCertificate);

// Protected routes (require active login session)
router.use(protect);

// User certificate list
router.get('/my', getMyCertificates);

// Secure PDF download endpoint
router.get('/download/:certificateId', downloadPDF);

// Organizer-restricted actions
router.use(authorizeRoles('organizer', 'admin'));

router.post('/generate-bulk', generateBulk);
router.post('/override', manualOverride);
router.get('/event/:eventId', getEventCertificates);

export default router;
