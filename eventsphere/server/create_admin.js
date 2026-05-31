import dns from 'dns';
// Force Google DNS to bypass local querySrv network limits
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load env variables
dotenv.config();

const createAdminUser = async () => {
  const adminEmail = 'admin@eventsphere.edu';
  const adminPassword = 'password123';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully.');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin account "${adminEmail}" already exists!`);
      // Update password to be sure
      const salt = await bcrypt.genSalt(10);
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, salt);
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Password synced successfully.');
      process.exit(0);
    }

    console.log('Creating official Administrator account...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create Admin User
    const admin = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
    });

    console.log('===================================================');
    console.log(`Admin account successfully created in your database!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('===================================================');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin account:', err);
    process.exit(1);
  }
};

createAdminUser();
