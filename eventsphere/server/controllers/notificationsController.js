import Notification from '../models/Notification.js';
import { runSmartAlertChecks } from '../utils/smartAlerts.js';

// @desc    Get user's notifications (paginated, newest first)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: null,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all user's notifications
// @route   DELETE /api/notifications/clear
// @access  Private
export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      data: null,
      message: 'All notifications cleared'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger Smart AI Alerts manually (Admin & Organizers only)
// @route   POST /api/notifications/trigger-ai-checks
// @access  Private
export const triggerAIChecks = async (req, res, next) => {
  try {
    if (!['organizer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to run AI analysis'
      });
    }

    const alertsTriggered = await runSmartAlertChecks();

    res.json({
      success: true,
      data: { alertsTriggered },
      message: `AI scheduled scan complete. Triggered ${alertsTriggered} new alerts.`
    });
  } catch (error) {
    next(error);
  }
};
