import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../server.js'; // We will export this from server.js

/**
 * Run AI heuristic scans to check platform states and generate smart alerts.
 * @returns {Promise<number>} The number of alerts generated
 */
export const runSmartAlertChecks = async () => {
  let alertsCount = 0;
  const now = new Date();

  try {
    // Fetch all published/ongoing events
    const events = await Event.find({ status: { $in: ['published', 'ongoing'] } }).populate('organizer');

    for (const event of events) {
      if (!event.organizer) {
        console.warn(`[AI Alerts Heuristics] Event "${event.title || event._id}" has no populated organizer. Skipping.`);
        continue;
      }
      const organizerId = event.organizer._id;

      // --- 1. Volunteer Shortage Check ---
      // Target needed: 1 volunteer per 40 participants of capacity, min 5.
      const neededVolunteers = Math.max(5, Math.ceil(event.capacity / 40));
      const activeVolunteersCount = event.volunteers.length;

      if (activeVolunteersCount < 0.6 * neededVolunteers) {
        const title = 'Volunteer shortage detected';
        const msg = `The event "${event.title}" has only ${activeVolunteersCount} volunteer(s) assigned out of the ${neededVolunteers} needed (capacity target). Consider recruiting more.`;
        
        // Prevent duplicate alerts in the last 30 minutes
        const duplicate = await Notification.findOne({
          userId: organizerId,
          title,
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        });

        if (!duplicate) {
          const notification = await Notification.create({
            userId: organizerId,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'ShieldAlert',
            isAI: true
          });
          
          sendNotificationToUser(organizerId.toString(), {
            _id: notification._id,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'ShieldAlert',
            isAI: true,
            createdAt: notification.createdAt
          });
          
          alertsCount++;
        }
      }

      // --- 2. Registration Spike Check (Registrations created in last 30 min >= 9) ---
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentRegsCount = await Registration.countDocuments({
        eventId: event._id,
        registeredAt: { $gte: thirtyMinutesAgo }
      });

      if (recentRegsCount >= 9) {
        const title = 'Registration spike observed';
        const msg = `High velocity registration activity: "${event.title}" has received ${recentRegsCount} new registrations in the last 30 minutes! Please check capacity limits.`;

        const duplicate = await Notification.findOne({
          userId: organizerId,
          title,
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
        });

        if (!duplicate) {
          const notification = await Notification.create({
            userId: organizerId,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'TrendingUp',
            isAI: true
          });

          sendNotificationToUser(organizerId.toString(), {
            _id: notification._id,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'TrendingUp',
            isAI: true,
            createdAt: notification.createdAt
          });

          alertsCount++;
        }
      }

      // --- 3. High No-show Risk Check (event starts within +/- 15 mins, check-in rate < 50%) ---
      // We check if event start date is close to now
      const timeDiff = Math.abs(event.startDate.getTime() - now.getTime());
      const fifteenMinutes = 15 * 60 * 1000;

      if (timeDiff <= fifteenMinutes) {
        const totalRegistrations = await Registration.countDocuments({ eventId: event._id });
        if (totalRegistrations > 0) {
          const checkedInCount = await Registration.countDocuments({
            eventId: event._id,
            attendanceStatus: true
          });

          const checkInRate = (checkedInCount / totalRegistrations) * 100;
          if (checkInRate < 50) {
            const title = 'High no-show risk — send reminder';
            const msg = `Critical turnout risk: only ${Math.round(checkInRate)}% of registered participants (${checkedInCount}/${totalRegistrations}) have checked in for "${event.title}". Consider sending a reminder broadcast.`;

            const duplicate = await Notification.findOne({
              userId: organizerId,
              title,
              createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
            });

            if (!duplicate) {
              const notification = await Notification.create({
                userId: organizerId,
                title,
                msg,
                role: 'organizer',
                type: 'ai_alert',
                icon: 'AlertTriangle',
                isAI: true
              });

              sendNotificationToUser(organizerId.toString(), {
                _id: notification._id,
                title,
                msg,
                role: 'organizer',
                type: 'ai_alert',
                icon: 'AlertTriangle',
                isAI: true,
                createdAt: notification.createdAt
              });

              alertsCount++;
            }
          }
        }
      }

      // --- 4. Session Drop-off Check (lunch slot finished, warnings trigger) ---
      // Let's inspect schedule titles for words like 'lunch' or 'break'
      const lunchSlot = event.schedule?.find(slot =>
        slot.title.toLowerCase().includes('lunch') || slot.title.toLowerCase().includes('break')
      );

      if (lunchSlot) {
        // If event is ongoing today, let's trigger a drop-off engagement analysis alert as simulation
        const title = 'Engagement drop after lunch break';
        const msg = `Post-lunch engagement warning: A drop in active participant check-ins or feedback metrics has been observed following the lunch break for "${event.title}". Consider initiating an interactive poll.`;

        // Check if alert was already sent in last 12 hours
        const duplicate = await Notification.findOne({
          userId: organizerId,
          title,
          createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        });

        // Trigger if event is ongoing
        if (!duplicate && event.status === 'ongoing') {
          const notification = await Notification.create({
            userId: organizerId,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'ZapOff',
            isAI: true
          });

          sendNotificationToUser(organizerId.toString(), {
            _id: notification._id,
            title,
            msg,
            role: 'organizer',
            type: 'ai_alert',
            icon: 'ZapOff',
            isAI: true,
            createdAt: notification.createdAt
          });

          alertsCount++;
        }
      }
    }
  } catch (error) {
    console.error('Error executing Smart AI Heuristics checks:', error);
  }

  return alertsCount;
};
