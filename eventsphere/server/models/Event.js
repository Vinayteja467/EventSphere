import mongoose from 'mongoose';

const scheduleItemSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  speaker: {
    type: String,
    default: ''
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  bannerImage: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    required: [true, 'Venue is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sponsors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor'
  }],
  schedule: {
    type: [scheduleItemSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed'],
    default: 'draft'
  },
  completedAt: {
    type: Date
  },
  certificateSettings: {
    autoGenerate: { type: Boolean, default: true },
    minAttendancePercent: { type: Number, default: 70 },
    requireQRCheckin: { type: Boolean, default: true },
    allowManualOverride: { type: Boolean, default: true },
    notifyOnReady: { type: Boolean, default: true },
    organizerSignatureName: { type: String, default: '' },
    organizerSignatureRole: { type: String, default: 'Event Director' },
    validityPeriod: { type: String, default: 'Lifetime' }
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
