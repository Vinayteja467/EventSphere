import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import { generateBulkForEvent } from './certificateController.js';

// @desc    Get all events (with search + filters)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email avatar')
      .populate('volunteers', 'name email avatar xp')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: events,
      message: 'Events fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private (Organizer only)
export const createEvent = async (req, res, next) => {
  try {
    const { title, description, bannerImage, venue, startDate, endDate, category, capacity, schedule, status, tags } = req.body;

    if (!title || !description || !venue || !startDate || !endDate || !category || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const event = await Event.create({
      title,
      description,
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
      venue,
      startDate,
      endDate,
      category,
      capacity,
      organizer: req.user._id,
      schedule: schedule || [],
      status: status || 'draft',
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin only)
export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Make sure user is event organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin only)
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Make sure user is event organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Use deleteOne instead of remove
    await Event.deleteOne({ _id: req.params.id });

    // Clean up related registrations
    await Registration.deleteMany({ eventId: req.params.id });

    res.json({
      success: true,
      data: null,
      message: 'Event and associated registrations deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event analytics
// @route   GET /api/analytics/:eventId
// @access  Private (Organizer/Admin)
export const getAnalytics = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Gather registrations
    const registrations = await Registration.find({ eventId }).populate('userId', 'name email');

    const totalRegistrations = registrations.length;
    const attendedCount = registrations.filter(r => r.attendanceStatus === true).length;
    const attendanceRate = totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0;

    // Build timeline of registration trend (group by date)
    const trendMap = {};
    registrations.forEach(r => {
      const dateStr = new Date(r.registeredAt).toISOString().split('T')[0];
      trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    });

    const registrationTrend = Object.keys(trendMap).map(date => ({
      date,
      count: trendMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Attendance chart data
    const attendanceData = [
      { name: 'Attended', value: attendedCount },
      { name: 'Absent', value: totalRegistrations - attendedCount }
    ];

    res.json({
      success: true,
      data: {
        eventId,
        eventTitle: event.title,
        totalRegistrations,
        attendedCount,
        attendanceRate,
        registrationTrend,
        attendanceData,
        capacity: event.capacity,
        activeVolunteers: event.volunteers.length,
        sponsorsOnboarded: event.sponsors.length
      },
      message: 'Analytics generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete an event and lock check-ins
// @route   PATCH /api/events/:id/complete
// @access  Private (Organizer only)
export const completeEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Ensure request is from organizer or admin
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this event' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Event has already been marked as completed.' });
    }

    event.status = 'completed';
    event.completedAt = new Date();
    await event.save();

    let certResults = null;
    let autoGenerated = false;

    // Trigger auto certificate generation if configured
    if (event.certificateSettings?.autoGenerate === true) {
      try {
        certResults = await generateBulkForEvent(event._id, req.user._id, true);
        autoGenerated = true;
      } catch (certErr) {
        console.error('Auto certificate generation failed on event completion:', certErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        event,
        autoGenerated,
        certificates: certResults
      },
      message: 'Event successfully marked as completed. Check-in logs are now locked.'
    });

  } catch (error) {
    next(error);
  }
};
