import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import MockInterview from './pages/MockInterview';
import InterviewResults from './pages/InterviewResults';
import InterviewReport from './pages/InterviewReport';
import ReportHistory from './pages/ReportHistory';
import MyQuestionsPage from './pages/MyQuestionsPage';

// Admin Pages
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminRoute from './admin/components/AdminRoute';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminHome from './admin/pages/AdminHome';
import UserManagement from './admin/pages/UserManagement';
import SkillManagement from './admin/pages/SkillManagement';
import QuestionManagement from './admin/pages/QuestionManagement';
import SessionMonitoring from './admin/pages/SessionMonitoring';
import Analytics from './admin/pages/Analytics';
import ContentModeration from './admin/pages/ContentModeration';
import SystemSettings from './admin/pages/SystemSettings';
import AuditLogs from './admin/pages/AuditLogs';
import JobEmailManagement from './admin/pages/JobEmailManagement';
import AdminSkillsAnalytics from './admin/pages/AdminSkillsAnalytics';

// Layout controls shared navigation and footer visibility per route.
const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const isDashboard = location.pathname === '/dashboard';
  const isInterview = location.pathname.includes('/interview');
  const isReport = location.pathname.includes('/report');
  const isAdmin = location.pathname.startsWith('/admin');

  // Admin routes have their own layout, no need for Navbar/Footer
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-50">
      {!isDashboard && !isInterview && !isReport && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAuthPage && !isDashboard && !isInterview && !isReport && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  // Route configuration for candidate and admin pages.
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Candidate Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview/:emailId" element={<MockInterview />} />
          <Route path="/interview/:emailId/results/:sessionId" element={<InterviewResults />} />
          <Route path="/report/:sessionId" element={<InterviewReport />} />
          <Route path="/reports" element={<ReportHistory />} />
          <Route path="/my-questions" element={<MyQuestionsPage />} />

          {/* Admin Routes — protected by AdminRoute, login via unified /signin */}
          <Route path="/admin" element={
            <AdminAuthProvider>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </AdminAuthProvider>
          }>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="skills" element={<SkillManagement />} />
            <Route path="questions" element={<QuestionManagement />} />
            <Route path="sessions" element={<SessionMonitoring />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="moderation" element={<ContentModeration />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="job-emails" element={<JobEmailManagement />} />
            <Route path="skills-analytics" element={<AdminSkillsAnalytics />} />
          </Route>
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
