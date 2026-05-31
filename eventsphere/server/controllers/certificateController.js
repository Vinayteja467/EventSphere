import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Certificate from '../models/Certificate.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generateCertificatePDF } from '../utils/generateCertificate.js';
import { sendNotificationToUser } from '../server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage folder exists
const getStorageDir = () => {
  const dir = path.join(__dirname, '..', 'storage', 'certificates');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Reusable helper for bulk generation
export const generateBulkForEvent = async (eventId, organizerId, overrideThreshold = false) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // 1. Fetch all registrations for this event
  const registrations = await Registration.find({ eventId }).populate('userId', 'name email role');
  if (registrations.length === 0) {
    return { generated: 0, skipped: 0, failed: 0, errors: [] };
  }

  // 2. Check overall attendance turnout
  const totalRegistered = registrations.length;
  const attendedCount = registrations.filter(r => r.attendanceStatus === true || r.isManualOverride === true).length;
  const attendanceRate = totalRegistered > 0 ? (attendedCount / totalRegistered) * 100 : 0;
  const minAttendance = event.certificateSettings?.minAttendancePercent ?? 70;

  if (attendanceRate < minAttendance && !overrideThreshold) {
    throw new Error(`Event turnout of ${Math.round(attendanceRate)}% is below the required ${minAttendance}% threshold. Turnout override is required.`);
  }

  const storageDir = getStorageDir();
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  // Loop through registrations and generate certificates
  for (const reg of registrations) {
    // Eligibility: must be attended or manually overridden
    const isEligible = reg.attendanceStatus === true || reg.isManualOverride === true;
    if (!isEligible) {
      continue; // Skip no-shows completely
    }

    try {
      // Enforce Rule 3: Check if Certificate already exists for this registration
      const existingCert = await Certificate.findOne({ registrationId: reg._id });
      if (existingCert) {
        skipped++;
        continue;
      }

      // Determine type: Is user an organizer/volunteer/speaker or winner?
      let certType = 'participant';
      let winnerPosition = '';

      // If user is in volunteers list
      if (event.volunteers.some(vId => vId.toString() === reg.userId._id.toString())) {
        certType = 'volunteer';
      }

      // Generate a new Certificate document to get an ID
      const cert = new Certificate({
        userId: reg.userId._id,
        eventId: event._id,
        registrationId: reg._id,
        type: certType,
        position: winnerPosition,
        issuedBy: organizerId,
        status: 'pending'
      });

      // Set verification URL
      cert.verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${cert.certificateId}`;

      // Dynamic date formatting
      const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Safe filename: EventName_ParticipantName_Certificate.pdf
      const sanitizedEvent = event.title.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedParticipant = reg.userId.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedEvent}_${sanitizedParticipant}_Certificate.pdf`;
      const pdfFilePath = path.join(storageDir, filename);

      // Generate the PDF Buffer
      const pdfBuffer = await generateCertificatePDF({
        participantName: reg.userId.name,
        eventName: event.title,
        eventDate,
        eventVenue: event.venue,
        organizerName: event.certificateSettings?.organizerSignatureName || 'Event Director',
        organizerRole: event.certificateSettings?.organizerSignatureRole || 'Event Director',
        certificateId: cert.certificateId,
        type: certType,
        position: winnerPosition
      });

      // Write the Buffer to storage file
      fs.writeFileSync(pdfFilePath, pdfBuffer);

      cert.pdfPath = `/storage/certificates/${filename}`; // Save path relative to public/storage
      cert.status = 'generated';
      await cert.save();

      // Update Registration document's certificate reference
      reg.certificateUrl = cert.verifyUrl;
      await reg.save();

      // Send notifications
      if (event.certificateSettings?.notifyOnReady !== false) {
        const title = 'Certificate issued!';
        const msg = `Congratulations! Your certificate of ${certType} for "${event.title}" is ready.`;
        
        const notif = await Notification.create({
          userId: reg.userId._id,
          title,
          msg,
          role: 'participant',
          type: 'announcement',
          icon: 'Award'
        });

        sendNotificationToUser(reg.userId._id.toString(), {
          _id: notif._id,
          title,
          msg,
          role: 'participant',
          type: 'announcement',
          icon: 'Award',
          createdAt: notif.createdAt
        });
      }

      generated++;
    } catch (err) {
      failed++;
      errors.push({ userId: reg.userId._id, reason: err.message });
    }
  }

  return { generated, skipped, failed, errors };
};

// @desc    Bulk generate certificates for completed event
// @route   POST /api/certificates/generate-bulk
// @access  Private (Organizer only)
export const generateBulk = async (req, res, next) => {
  try {
    const { eventId, overrideThreshold = false } = req.body;
    const results = await generateBulkForEvent(eventId, req.user._id, overrideThreshold);
    
    res.json({
      success: true,
      data: results,
      message: `${results.generated} certificates generated successfully. ${results.skipped} skipped. ${results.failed} failed.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual override to mark no-show as eligible and generate certificate
// @route   POST /api/certificates/override
// @access  Private (Organizer only)
export const manualOverride = async (req, res, next) => {
  try {
    const { eventId, userId, type = 'participant', position = '' } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Must be completed event
    if (event.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot override credentials for ongoing events.' });
    }

    const reg = await Registration.findOne({ eventId, userId }).populate('userId', 'name email');
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    // Force override flag
    reg.isManualOverride = true;
    await reg.save();

    // Check if certificate already exists
    let cert = await Certificate.findOne({ registrationId: reg._id });
    const isNew = !cert;

    if (isNew) {
      cert = new Certificate({
        userId,
        eventId,
        registrationId: reg._id,
        type,
        position,
        issuedBy: req.user._id,
        isManualOverride: true,
        status: 'pending'
      });
    } else {
      // Allow regeneration/overwrite for existing certificates as per Rule 5
      cert.type = type;
      cert.position = position;
      cert.isManualOverride = true;
      cert.status = 'pending';
    }

    cert.verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${cert.certificateId}`;

    const storageDir = getStorageDir();
    const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const sanitizedEvent = event.title.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedParticipant = reg.userId.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedEvent}_${sanitizedParticipant}_Certificate.pdf`;
    const pdfFilePath = path.join(storageDir, filename);

    const pdfBuffer = await generateCertificatePDF({
      participantName: reg.userId.name,
      eventName: event.title,
      eventDate,
      eventVenue: event.venue,
      organizerName: event.certificateSettings?.organizerSignatureName || req.user.name,
      organizerRole: event.certificateSettings?.organizerSignatureRole || 'Event Director',
      certificateId: cert.certificateId,
      type,
      position
    });

    fs.writeFileSync(pdfFilePath, pdfBuffer);
    cert.pdfPath = `/storage/certificates/${filename}`;
    cert.status = 'generated';
    await cert.save();

    reg.certificateUrl = cert.verifyUrl;
    await reg.save();

    // Notify user
    const title = 'Certificate updated!';
    const msg = `Your certificate for "${event.title}" is generated successfully under an organizer override.`;
    const notif = await Notification.create({
      userId,
      title,
      msg,
      role: 'participant',
      type: 'announcement',
      icon: 'Award'
    });

    sendNotificationToUser(userId.toString(), {
      _id: notif._id,
      title,
      msg,
      role: 'participant',
      type: 'announcement',
      icon: 'Award',
      createdAt: notif.createdAt
    });

    res.json({
      success: true,
      data: cert,
      message: `Manual override verified. Certificate successfully generated for ${reg.userId.name}.`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all certificates and eligibility list for an event
// @route   GET /api/certificates/event/:eventId
// @access  Private (Organizer only)
export const getEventCertificates = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const registrations = await Registration.find({ eventId }).populate('userId', 'name email avatar role');
    const certificates = await Certificate.find({ eventId }).populate('userId', 'name email');

    // Combine registrations with certificate generation state
    const report = registrations.map(reg => {
      const cert = certificates.find(c => c.registrationId.toString() === reg._id.toString());
      
      let eligibility = 'No-show';
      if (reg.attendanceStatus) eligibility = 'Eligible';
      if (reg.isManualOverride) eligibility = 'Override';

      return {
        userId: reg.userId._id,
        name: reg.userId.name,
        email: reg.userId.email,
        avatar: reg.userId.avatar,
        role: reg.userId.role,
        attendanceStatus: reg.attendanceStatus,
        checkedInAt: reg.checkedInAt,
        isManualOverride: reg.isManualOverride,
        eligibilityStatus: eligibility,
        certificate: cert ? {
          certificateId: cert.certificateId,
          type: cert.type,
          position: cert.position,
          status: cert.status,
          issuedAt: cert.issuedAt,
          verifyUrl: cert.verifyUrl
        } : null
      };
    });

    res.json({
      success: true,
      data: report,
      message: 'Participant certificates details loaded.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's certificates across all events
// @route   GET /api/certificates/my
// @access  Private (Participant/Volunteer/Sponsor/Admin)
export const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .populate('eventId', 'title venue startDate endDate category certificateSettings');

    res.json({
      success: true,
      data: certificates,
      message: 'Your earned certificates fetched successfully.'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Download static certificate PDF file as attachment
// @route   GET /api/certificates/download/:certificateId
// @access  Private (Owner or Organizer only)
export const downloadPDF = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId })
      .populate('userId', 'name')
      .populate('eventId', 'title category venue startDate');

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate credentials not found.' });
    }

    // Verify ownership: User is either the certificate earner or organizer of that event
    const event = await Event.findById(cert.eventId);
    const isOwner = cert.userId._id.toString() === req.user._id.toString();
    const isOrganizer = event && event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this certificate.' });
    }

    // Set dynamic filename format: EventName_ParticipantName_Certificate.pdf
    const sanitizedEvent = cert.eventId.title.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedParticipant = cert.userId.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedEvent}_${sanitizedParticipant}_Certificate.pdf`;

    // Path on local server
    const storageDir = getStorageDir();
    const filePath = path.join(storageDir, filename);

    // Always generate dynamically to prevent stale data when event details are updated.
    const eventDate = new Date(cert.eventId.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const pdfBuffer = await generateCertificatePDF({
      participantName: cert.userId.name,
      eventName: cert.eventId.title,
      eventDate,
      eventVenue: cert.eventId.venue,
      organizerName: event?.certificateSettings?.organizerSignatureName || 'Event Director',
      organizerRole: event?.certificateSettings?.organizerSignatureRole || 'Event Director',
      certificateId: cert.certificateId,
      type: cert.type,
      position: cert.position
    });

    // Quietly update local storage cache if directory is available
    try {
      if (fs.existsSync(storageDir)) {
        fs.writeFileSync(filePath, pdfBuffer);
      }
    } catch (writeErr) {
      console.error('Failed to update static certificate PDF file on disk:', writeErr);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfBuffer);

  } catch (error) {
    next(error);
  }
};

// @desc    Public certificate verification endpoint (No Auth Required)
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
export const verifyPublicCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId })
      .populate('userId', 'name avatar')
      .populate('eventId', 'title startDate endDate venue organizer')
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizer',
          select: 'name'
        }
      });

    if (!cert || cert.status !== 'generated') {
      return res.status(200).json({
        success: true,
        data: { valid: false },
        message: 'This certificate ID is invalid or cannot be verified.'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        certificateId: cert.certificateId,
        participantName: cert.userId.name,
        eventName: cert.eventId.title,
        eventDate: new Date(cert.eventId.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        eventVenue: cert.eventId.venue,
        type: cert.type,
        position: cert.position,
        issuedAt: cert.issuedAt,
        issuedBy: cert.eventId.organizer?.name || 'EventSphere Organizer'
      },
      message: 'Certificate credentials successfully verified.'
    });

  } catch (error) {
    next(error);
  }
};
