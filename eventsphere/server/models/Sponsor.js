import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    required: [true, 'Industry type is required'],
    trim: true
  },
  budgetRange: {
    type: String,
    required: [true, 'Budget range is required']
  },
  interests: {
    type: [String],
    default: []
  },
  previousEvents: {
    type: [String],
    default: []
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
});

const Sponsor = mongoose.model('Sponsor', sponsorSchema);
export default Sponsor;
