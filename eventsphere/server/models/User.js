import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  role: {
    type: String,
    enum: ['organizer', 'participant', 'volunteer', 'sponsor', 'admin'],
    default: 'participant'
  },
  avatar: {
    type: String,
    default: ''
  },
  xp: {
    type: Number,
    default: 0
  },
  badges: {
    type: [String],
    default: []
  },
  tasks: {
    type: [{
      title: String,
      deadline: String,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'done'],
        default: 'pending'
      },
      xpReward: {
        type: Number,
        default: 10
      }
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
export default User;
