import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './AdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Admin / Owner
  return <AdminDashboard />;
}
