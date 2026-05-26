import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  msg: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['organizer', 'participant', 'volunteer', 'sponsor', 'admin', 'system'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'event_update',
      'registration_success',
      'task_assigned',
      'shift_reminder',
      'sponsor_accepted',
      'milestone_reached',
      'ai_alert'
    ],
    required: true
  },
  icon: {
    type: String,
    default: 'Bell'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isAI: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to fetch notifications sorted by newest first for specific users
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
