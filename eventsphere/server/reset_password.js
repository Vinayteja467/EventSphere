import dns from 'dns';
// Force Google DNS to bypass local querySrv network limits
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load env variables
dotenv.config();

const resetPassword = async () => {
  const email = 'mass@gmail.com';
  const newPassword = 'password123';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully.');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    console.log(`Successfully reset password for "${email}" to "${newPassword}".`);
    console.log('You can now log in using these credentials.');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
};

resetPassword();
