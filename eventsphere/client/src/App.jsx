import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { PrivateRoute } from './routes/PrivateRoute.jsx';
import { RoleRoute } from './routes/RoleRoute.jsx';
import { Sparkles } from 'lucide-react';

// Pages
import { Landing } from './pages/Landing.jsx';
import { Auth } from './pages/Auth.jsx';
import { OrganizerDashboard } from './pages/OrganizerDashboard.jsx';
import { ParticipantDashboard } from './pages/ParticipantDashboard.jsx';
import { ParticipantMyEvents } from './pages/ParticipantMyEvents.jsx';
import { CertificateVault } from './pages/CertificateVault.jsx';
import { VolunteerDashboard } from './pages/VolunteerDashboard.jsx';
import { SponsorDashboard } from './pages/SponsorDashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { Profile } from './pages/Profile.jsx';
import { NotificationCenter } from './pages/NotificationCenter.jsx';
import { Verify } from './pages/Verify.jsx';
import { OrganizerCertificates } from './pages/Organizer/Certificates.jsx';

// Components
import { Sidebar } from './components/Sidebar.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { ToastNotification } from './components/ToastNotification.jsx';
import { OnboardingModal } from './components/OnboardingModal.jsx';
import { NotificationBell } from './components/NotificationBell.jsx';

// Main Layout Wrapper
const DashboardLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-primary">
      {/*Collapsible Sidebar for Desktop */}
      <Sidebar />

      {/* Main viewport */}
      <main className="flex-grow p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto max-h-screen">
        {/* Responsive Header row containing Logo/Title on mobile and NotificationBell */}
        <div className="flex justify-between md:justify-end items-center mb-6 border-b border-white/5 pb-4 flex-shrink-0">
          {/* Mobile Logo Title */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <span className="text-sm font-bold text-white uppercase tracking-wider">EventSphere</span>
          </div>

          <NotificationBell />
        </div>
        
        {children}
      </main>

      {/* Persistent Bottom Nav bar for mobile */}
      <BottomNav />

      {/* Universal Onboarding modal overlay */}
      <OnboardingModal />
    </div>
  );
};

export const AppContent = () => {
  return (
    <div className="min-h-screen bg-primary text-slate-100 flex flex-col justify-between">
      
      {/* Universal Toast popup managers */}
      <ToastContainer />
      <ToastNotification />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify/:certificateId" element={<Verify />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<PrivateRoute />}>
          
          {/* Organizer routes */}
          <Route element={<RoleRoute allowedRoles={['organizer', 'admin']} />}>
            <Route path="organizer" element={<DashboardLayout><OrganizerDashboard /></DashboardLayout>} />
            <Route path="organizer/events" element={<DashboardLayout><OrganizerDashboard /></DashboardLayout>} />
            <Route path="organizer/sponsor-match" element={<DashboardLayout><OrganizerDashboard /></DashboardLayout>} />
            <Route path="organizer/announcements" element={<DashboardLayout><OrganizerDashboard /></DashboardLayout>} />
            <Route path="organizer/events/:eventId/certificates" element={<DashboardLayout><OrganizerCertificates /></DashboardLayout>} />
          </Route>

          {/* Participant routes */}
          <Route element={<RoleRoute allowedRoles={['participant', 'admin']} />}>
            <Route path="participant" element={<DashboardLayout><ParticipantDashboard /></DashboardLayout>} />
            <Route path="participant/my-events" element={<DashboardLayout><ParticipantMyEvents /></DashboardLayout>} />
            <Route path="participant/certificates" element={<DashboardLayout><CertificateVault /></DashboardLayout>} />
          </Route>

          {/* Volunteer routes */}
          <Route element={<RoleRoute allowedRoles={['volunteer', 'admin']} />}>
            <Route path="volunteer" element={<DashboardLayout><VolunteerDashboard /></DashboardLayout>} />
            <Route path="volunteer/leaderboard" element={<DashboardLayout><VolunteerDashboard /></DashboardLayout>} />
          </Route>

          {/* Sponsor routes */}
          <Route element={<RoleRoute allowedRoles={['sponsor', 'admin']} />}>
            <Route path="sponsor" element={<DashboardLayout><SponsorDashboard /></DashboardLayout>} />
            <Route path="sponsor/ai-match" element={<DashboardLayout><SponsorDashboard /></DashboardLayout>} />
          </Route>

          {/* Admin routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
            <Route path="admin/users" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
            <Route path="admin/moderation" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
          </Route>

          {/* Shared Profile route */}
          <Route path="profile" element={<DashboardLayout><Profile /></DashboardLayout>} />

          {/* Shared Notifications Center route */}
          <Route path="notifications" element={<DashboardLayout><NotificationCenter /></DashboardLayout>} />

        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
