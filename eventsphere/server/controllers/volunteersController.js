import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../server.js';

// @desc    Get top 10 volunteers by XP
// @route   GET /api/volunteers/leaderboard
// @access  Public
export const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({ role: 'volunteer' })
      .select('name avatar xp badges')
      .sort({ xp: -1 })
      .limit(10);

    res.json({
      success: true,
      data: leaderboard,
      message: 'Volunteer leaderboard fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle status of a volunteer task
// @route   PATCH /api/volunteers/tasks/:taskId
// @access  Private (Volunteer only)
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body; // 'pending', 'in-progress', 'done'

    if (!['pending', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, in-progress, or done'
      });
    }

    const volunteer = await User.findById(req.user._id);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    // Find the task inside user's tasks
    const task = volunteer.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldStatus = task.status;
    task.status = status;

    let xpAwarded = 0;
    let badgeUnlocked = '';

    // If task changes to 'done' and wasn't 'done' before, reward XP
    if (status === 'done' && oldStatus !== 'done') {
      xpAwarded = task.xpReward || 10;
      volunteer.xp += xpAwarded;

      // Badge logic
      const originalBadgesCount = volunteer.badges.length;
      if (volunteer.xp >= 50 && !volunteer.badges.includes('Quick Scanner')) {
        volunteer.badges.push('Quick Scanner');
      }
      if (volunteer.xp >= 120 && !volunteer.badges.includes('Event Guardian')) {
        volunteer.badges.push('Event Guardian');
      }
      if (volunteer.xp >= 200 && !volunteer.badges.includes('Master Coordinator')) {
        volunteer.badges.push('Master Coordinator');
      }

      if (volunteer.badges.length > originalBadgesCount) {
        badgeUnlocked = volunteer.badges[volunteer.badges.length - 1];
      }
    }

    await volunteer.save();

    let rewardMessage = '';
    if (xpAwarded > 0) {
      rewardMessage = ` Earned +${xpAwarded} XP!`;
      if (badgeUnlocked) {
        rewardMessage += ` Unlocked badge: "${badgeUnlocked}"!`;
      }
    }

    // --- Save and Emit Notification ---
    try {
      const msg = `Task "${task.title}" updated to '${status}'.` + rewardMessage;
      const notif = await Notification.create({
        userId: volunteer._id,
        title: status === 'done' ? 'Task completed successfully!' : 'Task status updated',
        msg,
        role: 'volunteer',
        type: status === 'done' ? 'milestone_reached' : 'task_assigned',
        icon: status === 'done' ? 'CheckCircle' : 'Award'
      });

      sendNotificationToUser(volunteer._id.toString(), {
        _id: notif._id,
        title: notif.title,
        msg: notif.msg,
        role: 'volunteer',
        type: notif.type,
        icon: notif.icon,
        createdAt: notif.createdAt
      });
    } catch (notifErr) {
      console.error('Failed to create or emit task status update notification:', notifErr);
    }

    res.json({
      success: true,
      data: volunteer,
      message: `Task updated to '${status}'.` + rewardMessage
    });
  } catch (error) {
    next(error);
  }
};
