import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { generateQRCodeDataURL } from '../utils/generateQR.js';
import { generateCertificatePDF } from '../utils/generateCertificate.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../server.js';

// @desc    Register participant for an event
// @route   POST /api/registrations
// @access  Private (Participant/Admin)
export const registerParticipant = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check capacity
    if (event.participants.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This event is fully booked'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({ userId, eventId });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Create the registration first
    const registration = await Registration.create({
      userId,
      eventId,
      attendanceStatus: false
    });

    // Generate QR Code containing the registration ID
    const qrCodeDataUrl = await generateQRCodeDataURL(registration._id.toString());
    registration.qrCode = qrCodeDataUrl;
    await registration.save();

    // Add participant to event
    event.participants.push(userId);
    await event.save();

    // --- Save and Emit Notification ---
    try {
      const notif = await Notification.create({
        userId,
        title: 'Registration success',
        msg: `You have registered successfully for "${event.title}". Download your ticket pass!`,
        role: 'participant',
        type: 'registration_success',
        icon: 'CheckCircle'
      });

      sendNotificationToUser(userId.toString(), {
        _id: notif._id,
        title: notif.title,
        msg: notif.msg,
        role: 'participant',
        type: 'registration_success',
        icon: 'CheckCircle',
        createdAt: notif.createdAt
      });
    } catch (notifErr) {
      console.error('Failed to create or emit registration success notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Registered successfully for the event'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's registrations
// @route   GET /api/registrations/my
// @access  Private (Participant/Admin)
export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ userId: req.user._id })
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizer',
          select: 'name email avatar'
        }
      });

    res.json({
      success: true,
      data: registrations,
      message: 'Your registrations fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in attendee via QR scan
// @route   PATCH /api/registrations/:id/attendance
// @access  Private (Volunteer/Organizer/Admin only)
export const markAttendance = async (req, res, next) => {
  try {
    const registrationId = req.params.id;

    const registration = await Registration.findById(registrationId)
      .populate('userId', 'name email')
      .populate('eventId', 'title completedAt status');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found'
      });
    }

    // Rule 2: Lock QR check-in when event is marked complete
    if (registration.eventId && (registration.eventId.completedAt || registration.eventId.status === 'completed')) {
      return res.status(403).json({
        success: false,
        message: 'Attendance check-in is locked. The event has been marked as completed.'
      });
    }

    if (registration.attendanceStatus) {
      return res.status(400).json({
        success: false,
        message: `${registration.userId.name} is already checked in for ${registration.eventId.title}`
      });
    }

    // Mark checked in
    registration.attendanceStatus = true;
    registration.checkedInAt = new Date();
    await registration.save();

    // Reward scanning volunteer (if user is a volunteer)
    let volunteerMessage = '';
    if (req.user && req.user.role === 'volunteer') {
      const volunteer = await User.findById(req.user._id);
      if (volunteer) {
        volunteer.xp += 15; // 15 XP per check-in scan

        // Check for badge promotions
        const originalBadgesCount = volunteer.badges.length;
        if (volunteer.xp >= 50 && !volunteer.badges.includes('Quick Scanner')) {
          volunteer.badges.push('Quick Scanner');
        }
        if (volunteer.xp >= 120 && !volunteer.badges.includes('Event Guardian')) {
          volunteer.badges.push('Event Guardian');
        }

        await volunteer.save();
        volunteerMessage = ` +15 XP awarded to Volunteer ${volunteer.name}!`;
        if (volunteer.badges.length > originalBadgesCount) {
          volunteerMessage += ` New Badge Unlocked: ${volunteer.badges[volunteer.badges.length - 1]}!`;
        }
      }
    }

    // --- Save and Emit Notifications ---
    try {
      // 1. Notify the participant
      const pNotif = await Notification.create({
        userId: registration.userId._id,
        title: 'Check-in verified',
        msg: `Your check-in for "${registration.eventId.title}" is verified! You can now access your certificate after completion.`,
        role: 'participant',
        type: 'registration_success',
        icon: 'QrCode'
      });

      sendNotificationToUser(registration.userId._id.toString(), {
        _id: pNotif._id,
        title: pNotif.title,
        msg: pNotif.msg,
        role: 'participant',
        type: 'registration_success',
        icon: 'QrCode',
        createdAt: pNotif.createdAt
      });

      // 2. Notify the scanning volunteer if milestones/XP awarded
      if (volunteerMessage && req.user) {
        const vNotif = await Notification.create({
          userId: req.user._id,
          title: 'Milestone reached!',
          msg: volunteerMessage.trim(),
          role: 'volunteer',
          type: 'milestone_reached',
          icon: 'Award'
        });

        sendNotificationToUser(req.user._id.toString(), {
          _id: vNotif._id,
          title: vNotif.title,
          msg: vNotif.msg,
          role: 'volunteer',
          type: 'milestone_reached',
          icon: 'Award',
          createdAt: vNotif.createdAt
        });
      }
    } catch (notifErr) {
      console.error('Failed to create or emit attendance check-in notifications:', notifErr);
    }

    res.json({
      success: true,
      data: registration,
      message: `Successfully checked in ${registration.userId.name} for ${registration.eventId.title}.${volunteerMessage}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download certificate PDF
// @route   GET /api/certificates/:registrationId
// @access  Private (Participant/Admin)
export const getCertificate = async (req, res, next) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate('userId', 'name')
      .populate('eventId', 'title category venue startDate');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (!registration.attendanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'Attendance check-in is required to unlock this certificate.'
      });
    }

    // Date formatting
    const eventDate = new Date(registration.eventId.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const details = {
      userName: registration.userId.name,
      eventTitle: registration.eventId.title,
      category: registration.eventId.category,
      venue: registration.eventId.venue,
      date: eventDate,
      registrationId: registration._id.toString()
    };

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${registration._id}.pdf`);

    // Stream PDF directly to client response
    generateCertificatePDF(res, details);
  } catch (error) {
    next(error);
  }
};
