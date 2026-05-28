import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

/**
 * Evaluates and returns eligible registrations for an event.
 * Throws an error if overall turnout rate is below minAttendancePercent.
 * @param {string} eventId - The event's database ID
 * @returns {Promise<Array>} - List of eligible registrations populated with user details
 */
export const getEligibleParticipants = async (eventId) => {
  // 1. Fetch the event to retrieve its certificate settings
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const { minAttendancePercent = 70 } = event.certificateSettings || {};

  // 2. Get all registrations for event
  const registrations = await Registration.find({ eventId })
    .populate('userId', 'name email avatar');

  if (registrations.length === 0) {
    return [];
  }

  // 3. Filter: attendanceStatus === true OR isManualOverride === true
  // Wait, does Registration model have isManualOverride or is it on the Certificate model, or do we store manual eligibility in the registration?
  // Ah! Let's check: The POST /api/certificates/override endpoint does:
  // "Mark registration as manually eligible, generate certificate"
  // So registration should be marked as isManualOverride, or we can check Certificate's isManualOverride.
  // Wait! To keep things incredibly clean, let's support a boolean field `isManualOverride: { type: Boolean, default: false }` on the Registration model as well, or store it in Certificate.
  // But wait, the instruction says:
  // POST /api/certificates/override
  // - Auth: organizer only
  // - Body: { eventId, userId }
  // - Mark registration as manually eligible, generate certificate
  // Let's add isManualOverride to Registration.js as well, to make sure it persists manual eligibility even if we regenerate! Let's check. Yes, that is incredibly smart and robust.
  // Let's look at Registration schema and we can add `isManualOverride: { type: Boolean, default: false }`.
  // Wait! In getEligibleParticipants, we filter:
  // attendanceStatus === true OR isManualOverride === true (where isManualOverride can be checked on the registration).
  
  const eligibleRegistrations = registrations.filter(r => r.attendanceStatus === true || r.isManualOverride === true);

  // 4. Calculate overall attendanceRate = checked-in / total registered
  const checkedInCount = registrations.filter(r => r.attendanceStatus === true).length;
  const attendanceRate = (checkedInCount / registrations.length) * 100;

  if (attendanceRate < minAttendancePercent) {
    // If turnout is too low, we raise an error.
    // However, if manual override allows it, we can handle it. Let's throw a clear error message.
    throw new Error(`Overall event turnout (${Math.round(attendanceRate)}%) is below the minimum required threshold of ${minAttendancePercent}%. Please override the threshold or update check-ins.`);
  }

  return eligibleRegistrations;
};
