import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../server/models/User.js';
import Event from '../server/models/Event.js';

dotenv.config({ path: '../server/.env' });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('CONNECTED TO DB');

    const usersCount = await User.countDocuments();
    const eventsCount = await Event.countDocuments();
    console.log('USERS COUNT:', usersCount);
    console.log('EVENTS COUNT:', eventsCount);

    const users = await User.find().limit(5);
    console.log('SAMPLE USERS:', users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    const events = await Event.find().populate('organizer');
    console.log('SAMPLE EVENTS:', events.map(e => ({
      id: e._id,
      title: e.title,
      organizerRaw: e.organizer ? 'EXISTS' : 'NULL',
      organizerVal: e.organizer
    })));

    mongoose.connection.close();
  } catch (err) {
    console.error('ERROR CHECKING DB:', err);
  }
};

check();
