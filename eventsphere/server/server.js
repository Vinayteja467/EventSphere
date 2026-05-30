import dns from 'dns';
// Force Node.js to use Google DNS to bypass local querySrv ECONNREFUSED network limits
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

// Load environmental variables
dotenv.config();

// Import Routes
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import userRoutes from './routes/userRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import certificateRoutes from './routes/certificates.js';
import sponsorshipRoutes from './routes/sponsorshipRoutes.js';

// Import individual controller handlers for distinct paths
import { getAnalytics } from './controllers/eventsController.js';
import { getCertificate } from './controllers/registrationsController.js';
import { protect } from './middleware/authMiddleware.js';

// Import Error Handler Middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import Smart Alerts Runner
import { runSmartAlertChecks } from './utils/smartAlerts.js';

// Connect to MongoDB Database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Initialize DB Connection
connectDB();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Main Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/sponsor', sponsorshipRoutes);

// Distinct/Separate mounts required by specifications
app.get('/api/analytics/:eventId', protect, getAnalytics);

// Basic verification endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EventSphere AI Backend API is active with Socket.io enabled.'
  });
});

// Fallback global error handling middleware
app.use(errorHandler);

// --- Socket.io Integration ---
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    credentials: true
  }
});

// Store connected sockets mapping userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Socket joins specific rooms on instruction from client
  socket.on('join_user', (userId) => {
    socket.join(userId);
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} joined their private notification room.`);
  });

  socket.on('join_event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined broadcast room event_${eventId}`);
  });

  socket.on('leave_event', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`Socket ${socket.id} left broadcast room event_${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

/**
 * Global helper to send a real-time notification to a specific user
 * @param {string} userId - The target user's MongoDB ID
 * @param {object} payload - The notification payload to emit
 */
export const sendNotificationToUser = (userId, payload) => {
  if (io) {
    io.to(userId).emit('notification', payload);
    console.log(`Socket emitted notification to user ${userId}`);
  }
};

/**
 * Global helper to broadcast a notification to all subscribers in an event room
 * @param {string} eventId - The event's MongoDB ID
 * @param {object} payload - The notification payload to emit
 */
export const broadcastNotificationToEvent = (eventId, payload) => {
  if (io) {
    io.to(`event_${eventId}`).emit('notification', payload);
    console.log(`Socket broadcast notification to room event_${eventId}`);
  }
};

// --- Smart AI Alerts Cron-Heuristic Scheduler ---
// Scans database stats every 15 minutes
const FIFTEEN_MINUTES = 15 * 60 * 1000;
setInterval(async () => {
  console.log('[AI Check Scheduler] Executing Smart AI Alerts Heuristics scanning...');
  const alertsTriggered = await runSmartAlertChecks();
  console.log(`[AI Check Scheduler] Heuristics checks completed. ${alertsTriggered} new alerts generated.`);
}, FIFTEEN_MINUTES);

// Run an initial scan 10 seconds after server startup
setTimeout(async () => {
  console.log('[AI Check Scheduler] Running initial database health scan...');
  const initialAlerts = await runSmartAlertChecks();
  console.log(`[AI Check Scheduler] Initial scan completed. Generated ${initialAlerts} warning alerts.`);
}, 10000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server executing in development mode on port ${PORT} with Socket.io`);
});
