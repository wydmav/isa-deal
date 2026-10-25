import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import Search from '../features/Search';
import Profile from '../features/Profile';
import BookingWorkspace from '../features/BookingWorkspace';
import Dashboard from '../features/Dashboard';
import AdminDashboard from '../features/AdminDashboard';

function RedirectIfLoggedIn() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  return null;
}

export default function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<><RedirectIfLoggedIn /><Search /></>} />
        <Route path="/book/:handle" element={<Profile />} />
        <Route path="/bookings/:id" element={<BookingWorkspace />} />
      </Route>

      {/* Protected User Routes (Promoter / Performer) */}
      <Route element={<PublicLayout />}>
        <Route path="/dashboard" element={user && user.role !== 'admin' ? <Dashboard /> : <Navigate to="/" replace />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}