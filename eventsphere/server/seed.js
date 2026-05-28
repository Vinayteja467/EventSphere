import dns from 'dns';
// Force Node.js to use Google DNS to bypass local querySrv ECONNREFUSED network limits
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load models
import User from './models/User.js';
import Event from './models/Event.js';
import Sponsor from './models/Sponsor.js';
import Registration from './models/Registration.js';
import Announcement from './models/Announcement.js';
import Certificate from './models/Certificate.js';

// Utilities
import { generateQRCodeDataURL } from './utils/generateQR.js';
import { generateCertificatePDF } from './utils/generateCertificate.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedDatabase = async () => {
  try {
    // 1. Establish DB Connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventsphere');
    console.log('Database Connected for seeding.');

    // 2. Wipe existing data sheets
    await User.deleteMany({});
    await Event.deleteMany({});
    await Sponsor.deleteMany({});
    await Registration.deleteMany({});
    await Announcement.deleteMany({});
    await Certificate.deleteMany({});
    console.log('Existing database sheets wiped clean.');

    // 3. Hash a default password
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    // 4. Create 10 Users (2 organizers, 4 participants, 2 volunteers, 2 sponsors)
    const users = await User.create([
      // Organizers
      {
        name: 'Alex Rivera',
        email: 'alex@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'organizer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex'
      },
      {
        name: 'Elena Rostova',
        email: 'elena@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'organizer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena'
      },
      // Participants
      {
        name: 'Jane Doe',
        email: 'jane@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'participant',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jane'
      },
      {
        name: 'John Smith',
        email: 'john@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'participant',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=John'
      },
      {
        name: 'Kofi Annan',
        email: 'kofi@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'participant',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kofi'
      },
      {
        name: 'Li Wei',
        email: 'li@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'participant',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Li'
      },
      // Volunteers (preseeded with interactive tasks)
      {
        name: 'Marcus Brody',
        email: 'marcus@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'volunteer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus',
        xp: 35,
        badges: ['Quick Scanner'],
        tasks: [
          { title: 'Secure verification desk templates', deadline: '9:00 AM', status: 'done', xpReward: 15 },
          { title: 'Align corporate backdrops on Stage 2', deadline: '10:30 AM', status: 'in-progress', xpReward: 20 },
          { title: 'Audit check-in clickers counts', deadline: '2:00 PM', status: 'pending', xpReward: 15 }
        ]
      },
      {
        name: 'Clara Oswald',
        email: 'clara@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'volunteer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Clara',
        xp: 15,
        badges: [],
        tasks: [
          { title: 'Distribute speaker microphone packets', deadline: '9:30 AM', status: 'pending', xpReward: 10 },
          { title: 'Escort sponsor representatives', deadline: '11:00 AM', status: 'pending', xpReward: 15 }
        ]
      },
      // Sponsors
      {
        name: 'Vercel rep',
        email: 'vercel@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'sponsor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vercel'
      },
      {
        name: 'Google rep',
        email: 'google@eventsphere.edu',
        passwordHash: defaultPasswordHash,
        role: 'sponsor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Google'
      }
    ]);

    console.log('10 User accounts created.');

    const alexOrganizer = users[0];
    const elenaOrganizer = users[1];
    
    const participantJane = users[2];
    const participantJohn = users[3];
    const participantKofi = users[4];
    const participantLi = users[5];

    const volunteerMarcus = users[6];
    const volunteerClara = users[7];

    const sponsorUserVercel = users[8];
    const sponsorUserGoogle = users[9];

    // 5. Create 4 Sponsor Profiles
    const sponsors = await Sponsor.create([
      {
        userId: sponsorUserVercel._id,
        companyName: 'Vercel Inc.',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Vercel',
        industry: 'Technology & Web Hosting',
        budgetRange: '$5,000 - $10,000',
        interests: ['Hackathon', 'React', 'Frontend Dev', 'Workshop'],
        previousEvents: ['NextJS Conf 2025', 'React London Hack'],
        verificationStatus: 'verified'
      },
      {
        userId: sponsorUserGoogle._id,
        companyName: 'Google Cloud',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Google',
        industry: 'Cloud Computing & Tech',
        budgetRange: 'Above $25,000',
        interests: ['Hackathon', 'AI', 'Machine Learning', 'Cloud Infra'],
        previousEvents: ['Google I/O 2025', 'KubeCon Chicago'],
        verificationStatus: 'verified'
      },
      // Create additional mock sponsors for AI matchmaking options
      {
        userId: new mongoose.Types.ObjectId(), // Virtual user link for mock
        companyName: 'Stripe Payments',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=Stripe',
        industry: 'Financial Technology',
        budgetRange: '$10,000 - $25,000',
        interests: ['Hackathon', 'Fintech', 'Security API'],
        previousEvents: ['Stripe Sessions 2025'],
        verificationStatus: 'verified'
      },
      {
        userId: new mongoose.Types.ObjectId(),
        companyName: 'GitHub Inc.',
        logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GitHub',
        industry: 'Software Development DevOps',
        budgetRange: '$5,000 - $10,000',
        interests: ['Hackathon', 'Open Source', 'DevOps'],
        previousEvents: ['GitHub Universe 2025'],
        verificationStatus: 'verified'
      }
    ]);

    console.log('4 Sponsor profiles onboarded.');

    const vercelSponsor = sponsors[0];
    const googleSponsor = sponsors[1];

    // 6. Create 3 Events (1 hackathon, 1 workshop, 1 seminar)
    const currentDate = new Date();
    
    // Future dates
    const date1 = new Date(currentDate); date1.setDate(currentDate.getDate() + 3);
    const date1End = new Date(date1); date1End.setDate(date1.getDate() + 2);

    const date2 = new Date(currentDate); date2.setDate(currentDate.getDate() + 5);
    const date2End = new Date(date2); date2End.setHours(date2.getHours() + 4);

    const date3 = new Date(currentDate); date3.setDate(currentDate.getDate() + 8);
    const date3End = new Date(date3); date3End.setHours(date3.getHours() + 3);

    const events = await Event.create([
      {
        title: 'EventSphere HackFest 2026',
        description: 'A massive 48-hour student hackathon centered around creating next-generation agentic AI coding assistants and glassmorphism web panels. Build solutions with cutting edge APIs.',
        bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
        venue: 'Collegiate Main Gymnasium Complex, Sector 4',
        startDate: date1,
        endDate: date1End,
        category: 'Hackathon',
        capacity: 250,
        organizer: alexOrganizer._id,
        volunteers: [volunteerMarcus._id, volunteerClara._id],
        participants: [participantJane._id, participantJohn._id, participantKofi._id, participantLi._id],
        sponsors: [vercelSponsor._id, googleSponsor._id],
        schedule: [
          { time: '09:00 AM', title: 'Opening Keynote & Rules Briefing', speaker: 'Alex Rivera' },
          { time: '11:00 AM', title: 'AI Frameworks & APIs Overview', speaker: 'Elena Rostova' },
          { time: '02:00 PM', title: 'Coding Commences', speaker: 'All Organizers' }
        ],
        status: 'published',
        tags: ['AI', 'Agentic', 'Web Dev', 'Hackathon']
      },
      {
        title: 'NextJS & React 19 Bootcamp',
        description: 'A hands-on workshop guiding frontend engineers through Server Actions, custom suspense boundaries, and backdrop blur optimizations in Vite layout architectures.',
        bannerImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60',
        venue: 'Computer Science Department Lab Room 204',
        startDate: date2,
        endDate: date2End,
        category: 'Workshop',
        capacity: 60,
        organizer: elenaOrganizer._id,
        volunteers: [volunteerMarcus._id],
        participants: [participantJane._id, participantLi._id],
        sponsors: [vercelSponsor._id],
        schedule: [
          { time: '10:00 AM', title: 'React 19 Hooks & Paradigms', speaker: 'Elena Rostova' },
          { time: '12:00 PM', title: 'Server Components Lab Routing', speaker: 'Jane Doe' }
        ],
        status: 'published',
        tags: ['React', 'NextJS', 'Vite', 'Workshop']
      },
      {
        title: 'Agentic AI Systems Seminar',
        description: 'An academic seminar focusing on LLM models fine-tuning, system prompts structured boundaries, and the future of Advanced Agentic Coding in computer science curriculums.',
        bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
        venue: 'Academic Auditorium Block C',
        startDate: date3,
        endDate: date3End,
        category: 'Seminar',
        capacity: 150,
        organizer: alexOrganizer._id,
        volunteers: [volunteerClara._id],
        participants: [participantJohn._id, participantKofi._id],
        sponsors: [googleSponsor._id],
        schedule: [
          { time: '02:00 PM', title: 'Advanced LLM Decoders', speaker: 'Dr. Gregory House' },
          { time: '03:30 PM', title: 'Panel Q&A: Agent Safety', speaker: 'Alex Rivera' }
        ],
        status: 'published',
        tags: ['LLM', 'AI', 'Seminar']
      },
      {
        title: 'Vite Layout & Glassmorphism Summit 2026',
        description: 'An advanced symposium exploring backdrop blur configurations, harmonized HSL tailoring gradients, and custom utility stylesheets inside modern Vite React client architectures.',
        bannerImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=60',
        venue: 'Engineering Block Auditorium B, Hall 3',
        startDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        category: 'Cultural',
        capacity: 100,
        organizer: alexOrganizer._id,
        volunteers: [volunteerMarcus._id],
        participants: [participantJane._id, participantKofi._id],
        sponsors: [vercelSponsor._id],
        schedule: [
          { time: '10:00 AM', title: 'Aesthetic Styling Basics', speaker: 'Elena Rostova' },
          { time: '11:30 AM', title: 'Glowing Glassmorphism Panels', speaker: 'Alex Rivera' }
        ],
        status: 'completed',
        completedAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        certificateSettings: {
          autoGenerate: true,
          minAttendancePercent: 50,
          requireQRCheckin: true,
          allowManualOverride: true,
          notifyOnReady: true,
          organizerSignatureName: 'Alex Rivera',
          organizerSignatureRole: 'Event Director',
          validityPeriod: 'Lifetime'
        },
        tags: ['Vite', 'CSS', 'Glassmorphism']
      }
    ]);

    console.log('4 Core Events created (1 Completed).');

    const hackfestEvent = events[0];
    const reactWorkshopEvent = events[1];
    const aiSeminarEvent = events[2];
    const viteSummitEvent = events[3];

    // 7. Populate registrations (bridging participants to events)
    const registrationList = [
      // HackFest (4 participants)
      { userId: participantJane._id, eventId: hackfestEvent._id, attendanceStatus: true, checkedInAt: new Date(date1) },
      { userId: participantJohn._id, eventId: hackfestEvent._id, attendanceStatus: false },
      { userId: participantKofi._id, eventId: hackfestEvent._id, attendanceStatus: true, checkedInAt: new Date(date1) },
      { userId: participantLi._id, eventId: hackfestEvent._id, attendanceStatus: false },
      // React Workshop (2 participants)
      { userId: participantJane._id, eventId: reactWorkshopEvent._id, attendanceStatus: true, checkedInAt: new Date(date2) },
      { userId: participantLi._id, eventId: reactWorkshopEvent._id, attendanceStatus: false },
      // AI Seminar (2 participants)
      { userId: participantJohn._id, eventId: aiSeminarEvent._id, attendanceStatus: true, checkedInAt: new Date(date3) },
      { userId: participantKofi._id, eventId: aiSeminarEvent._id, attendanceStatus: false },
      // Vite Summit Completed (2 participants, both checked in)
      { userId: participantJane._id, eventId: viteSummitEvent._id, attendanceStatus: true, checkedInAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { userId: participantKofi._id, eventId: viteSummitEvent._id, attendanceStatus: true, checkedInAt: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) }
    ];

    for (const reg of registrationList) {
      const dbReg = await Registration.create(reg);
      // Generate QR pass containing registrationId
      const qrCodeDataUrl = await generateQRCodeDataURL(dbReg._id.toString());
      dbReg.qrCode = qrCodeDataUrl;
      await dbReg.save();

      // If registration is for the pre-completed event, auto-create certificate!
      if (reg.eventId.toString() === viteSummitEvent._id.toString()) {
        const userObj = users.find(u => u._id.toString() === reg.userId.toString());
        const name = userObj ? userObj.name : 'Jane Doe';

        const cert = await Certificate.create({
          userId: reg.userId,
          eventId: viteSummitEvent._id,
          registrationId: dbReg._id,
          type: 'participant',
          issuedBy: alexOrganizer._id,
          status: 'generated'
        });

        cert.verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${cert.certificateId}`;

        // Directory mapping
        const storageDir = path.join(__dirname, 'storage', 'certificates');
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }

        const sanitizedEvent = viteSummitEvent.title.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedParticipant = name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${sanitizedEvent}_${sanitizedParticipant}_Certificate.pdf`;
        const pdfFilePath = path.join(storageDir, filename);

        const pdfBuffer = await generateCertificatePDF({
          participantName: name,
          eventName: viteSummitEvent.title,
          eventDate: new Date(viteSummitEvent.startDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          eventVenue: viteSummitEvent.venue,
          organizerName: 'Alex Rivera',
          organizerRole: 'Event Director',
          certificateId: cert.certificateId,
          type: 'participant'
        });

        fs.writeFileSync(pdfFilePath, pdfBuffer);
        cert.pdfPath = `/storage/certificates/${filename}`;
        await cert.save();

        dbReg.certificateUrl = cert.verifyUrl;
        await dbReg.save();
      }
    }

    console.log('Registrations populated, pre-completed certificates generated successfully.');

    // 8. Create 3 Announcements
    await Announcement.create([
      {
        eventId: hackfestEvent._id,
        organizer: alexOrganizer._id,
        title: 'Join our HackFest Discord Server!',
        body: 'Welcome hackers! We have configured private Discord channels for team formation and mentor help. Check your onboarding packets for invitation codes.',
        type: 'update'
      },
      {
        eventId: hackfestEvent._id,
        organizer: alexOrganizer._id,
        title: 'Check-in Desk Opens at 8:00 AM',
        body: 'Gate checkers will be active in Gym Sector 4. Present your downloaded EventSphere Ticket QR Code PNG for rapid webcam check-ins.',
        type: 'reminder'
      },
      {
        eventId: reactWorkshopEvent._id,
        organizer: elenaOrganizer._id,
        title: 'Prerequisite Node Versions',
        body: 'Please ensure your laptops have Node 20.x or above installed before entering Department Lab 204.',
        type: 'alert'
      }
    ]);

    console.log('3 Announcements posted.');

    console.log('Database seeding completely successful!');
    mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Seeding process encountered an error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Execute seeder
seedDatabase();
