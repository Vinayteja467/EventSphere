import Announcement from '../models/Announcement.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { broadcastNotificationToEvent } from '../server.js';

// @desc    Create an announcement for an event
// @route   POST /api/announcements
// @access  Private (Organizer only)
export const createAnnouncement = async (req, res, next) => {
  try {
    const { eventId, title, body, type } = req.body;

    if (!eventId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, title, and body'
      });
    }

    // Verify event exists and is owned by the organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send announcements for this event'
      });
    }

    const announcement = await Announcement.create({
      eventId,
      organizer: req.user._id,
      title,
      body,
      type: type || 'update'
    });

    // --- Create & Broadcast Notifications ---
    try {
      // Find all registered participants
      const registrations = await Registration.find({ eventId });
      const userIds = registrations.map(r => r.userId.toString());

      // Include assigned volunteers
      event.volunteers.forEach(v => {
        const vId = v.toString();
        if (!userIds.includes(vId)) {
          userIds.push(vId);
        }
      });

      // Save notification in database for all registered users
      const notificationPromises = userIds.map(uId => 
        Notification.create({
          userId: uId,
          title: `New announcement: ${title}`,
          msg: body,
          role: 'participant',
          type: 'event_update',
          icon: 'Volume2'
        })
      );
      await Promise.all(notificationPromises);

      // Real-time socket broadcast to the event room
      broadcastNotificationToEvent(eventId, {
        title: `New announcement: ${title}`,
        msg: body,
        role: 'participant',
        type: 'event_update',
        icon: 'Volume2',
        createdAt: new Date()
      });
    } catch (notifError) {
      console.error('Failed to create or emit announcement notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement posted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements for an event
// @route   GET /api/announcements/event/:eventId
// @access  Private
export const getAnnouncementsByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const announcements = await Announcement.find({ eventId })
      .populate('organizer', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements,
      message: 'Announcements fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements for all events a participant is registered for
// @route   GET /api/announcements/my-feed
// @access  Private (Participant/Volunteer)
export const getMyAnnouncementsFeed = async (req, res, next) => {
  try {
    // Find all registrations for this user
    const registrations = await Registration.find({ userId: req.user._id });
    const eventIds = registrations.map(r => r.eventId);

    // Also include events they volunteer for
    const volunteerEvents = await Event.find({ volunteers: req.user._id });
    volunteerEvents.forEach(e => {
      if (!eventIds.some(id => id.toString() === e._id.toString())) {
        eventIds.push(e._id);
      }
    });

    const announcements = await Announcement.find({ eventId: { $in: eventIds } })
      .populate('eventId', 'title bannerImage')
      .populate('organizer', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements,
      message: 'Feed announcements fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};
