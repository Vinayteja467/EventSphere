import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
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
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['participant', 'volunteer', 'winner', 'speaker'],
    default: 'participant'
  },
  position: {
    type: String // '1st Place', '2nd Place' etc. — for winner type
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifyUrl: {
    type: String
  },
  pdfPath: {
    type: String
  },
  isManualOverride: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Ensure a user can only have one certificate per event
certificateSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
