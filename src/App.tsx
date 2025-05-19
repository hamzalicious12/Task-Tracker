import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import NotificationDebugger from './pages/NotificationDebugger';
import CEODashboard from './pages/dashboards/CEO';
import DirectorDashboard from './pages/dashboards/Director';
import EmployeeDashboard from './pages/dashboards/Employee';
import AdminDashboard from './pages/dashboards/Admin';
import AdminDepartments from './pages/Admin/Departments';
import CEODepartments from './pages/CEO/Departments';
import CEOAttendanceFixed from './pages/Attendance/CEOAttendanceFixed';
import DirectorAttendance from './pages/Attendance/DirectorAttendance';
import EmployeeAttendance from './pages/Attendance/EmployeeAttendance';
import CEOMeetingsFixed from './pages/Meetings/CEOMeetingsFixed';
import DirectorMeetings from './pages/Meetings/DirectorMeetings';
import DirectorTeam from './pages/Director/Team';

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    switch (user?.role) {
      case 'CEO':
        return '/ceo';
      case 'DIRECTOR':
        return '/director';
      case 'EMPLOYEE':
        return '/employee';
      case 'ADMIN':
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={getDashboardRoute()} />} />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* CEO Routes */}
      <Route path="/ceo" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <CEODashboard />
        </ProtectedRoute>
      } />
      <Route path="/ceo/attendance" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <CEOAttendanceFixed />
        </ProtectedRoute>
      } />
      <Route path="/ceo/meetings" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <CEOMeetingsFixed />
        </ProtectedRoute>
      } />
      <Route path="/ceo/departments" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <CEODepartments />
        </ProtectedRoute>
      } />
      
      {/* Director Routes */}
      <Route path="/director" element={
        <ProtectedRoute allowedRoles={['DIRECTOR']}>
          <DirectorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/director/attendance" element={
        <ProtectedRoute allowedRoles={['DIRECTOR']}>
          <DirectorAttendance />
        </ProtectedRoute>
      } />
      <Route path="/director/meetings" element={
        <ProtectedRoute allowedRoles={['DIRECTOR']}>
          <DirectorMeetings />
        </ProtectedRoute>
      } />
      <Route path="/director/team" element={
        <ProtectedRoute allowedRoles={['DIRECTOR']}>
          <DirectorTeam />
        </ProtectedRoute>
      } />
      
      {/* Employee Routes */}
      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employee/attendance" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <EmployeeAttendance />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <EmployeeAttendance />
        </ProtectedRoute>
      } />
      <Route path="/admin/departments" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDepartments />
        </ProtectedRoute>
      } />
      
      {/* Shared Routes */}
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/debug-notifications" element={
        <ProtectedRoute allowedRoles={['CEO']}>
          <NotificationDebugger />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;