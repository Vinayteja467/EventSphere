import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Announcement message content is required']
  },
  type: {
    type: String,
    enum: ['update', 'alert', 'reminder'],
    default: 'update'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
