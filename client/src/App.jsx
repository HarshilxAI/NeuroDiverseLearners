import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelectPage from './pages/RoleSelectPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DiagnosticPage from './pages/DiagnosticPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentDashboard from './pages/ParentDashboard';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to={`/dashboard/${user.role.toLowerCase()}`} /> : <RoleSelectPage />} />
      <Route path="/login" element={user ? <Navigate to={`/dashboard/${user.role.toLowerCase()}`} /> : <LoginPage />} />

      {/* Student routes */}
      <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['Student']}><OnboardingPage /></ProtectedRoute>} />
      <Route path="/diagnostic" element={<ProtectedRoute allowedRoles={['Student']}><DiagnosticPage /></ProtectedRoute>} />
      <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />

      {/* Teacher routes */}
      <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['Teacher']}><TeacherDashboard /></ProtectedRoute>} />

      {/* Parent routes */}
      <Route path="/dashboard/parent" element={<ProtectedRoute allowedRoles={['Parent']}><ParentDashboard /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'Student' && !user.onboardingComplete ? '/diagnostic' : `/dashboard/${user.role.toLowerCase()}`) : '/'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
