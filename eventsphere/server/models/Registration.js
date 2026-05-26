import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  qrCode: {
    type: String,
    default: ''
  },
  attendanceStatus: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate registrations for the same event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
