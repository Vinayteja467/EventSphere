import mongoose from 'mongoose';

const sponsorshipSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor',
    required: true
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required']
  },
  message: {
    type: String,
    required: [true, 'Message to organizer is required']
  },
  perksRequested: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Avoid duplicate sponsorship offers from the same sponsor to the same event
sponsorshipSchema.index({ eventId: 1, sponsorId: 1 }, { unique: true });

const Sponsorship = mongoose.model('Sponsorship', sponsorshipSchema);
export default Sponsorship;
