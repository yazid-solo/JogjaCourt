import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
// Customer Pages
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import { ChatNotifProvider } from './context/ChatNotifContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalToast from './components/ui/GlobalToast';
import api from './lib/api';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Venues = lazy(() => import('./pages/dashboard/Venues'));
const Bookings = lazy(() => import('./pages/dashboard/Bookings'));
const Finance = lazy(() => import('./pages/dashboard/Finance'));
const Users = lazy(() => import('./pages/dashboard/Users'));
const Chat = lazy(() => import('./pages/dashboard/Chat'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Testimonials = lazy(() => import('./pages/dashboard/Testimonials'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Areas = lazy(() => import('./pages/dashboard/Areas'));
const VenueVerification = lazy(() => import('./pages/dashboard/VenueVerification'));
const TicketScanner = lazy(() => import('./pages/dashboard/TicketScanner'));
const ExploreVenues = lazy(() => import('./pages/customer/ExploreVenues'));
const VenueDetail = lazy(() => import('./pages/customer/VenueDetail'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Payment = lazy(() => import('./pages/customer/Payment'));
const MyBookings = lazy(() => import('./pages/customer/MyBookings'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const CustomerNotifications = lazy(() => import('./pages/customer/Notifications'));
const Legal = lazy(() => import('./pages/public/Legal'));
const MitraRegister = lazy(() => import('./pages/MitraRegister'));


// Komponen Halaman Placeholder (Kosong)

const PageLoader = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-neutral-800 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-neutral-800 border-b-white rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
      </div>
    </div>
    <p className="text-[#D4AF37] font-bold text-sm tracking-widest animate-pulse">MEMUAT...</p>
  </div>
);

const BlankPage = ({ title }) => (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-gray-400">Halaman ini sedang dalam tahap konstruksi.</p>
        </div>
    </div>
);

function App() {
    useEffect(() => {
        // 1. Wake up backend (for Free Tier hosting like Render/Railway)
        // This fires instantly when the app loads, ensuring the backend is awake when the user navigates
        api.get('/').catch(() => {});

        // 2. Prefetch critical chunks after 2 seconds to make navigation instant (Zero loading spinner!)
        const prefetchTimer = setTimeout(() => {
            const prefetch = (importFunc) => importFunc().catch(() => {});
            prefetch(() => import('./pages/Login'));
            prefetch(() => import('./pages/Register'));
            prefetch(() => import('./pages/customer/ExploreVenues'));
            prefetch(() => import('./pages/dashboard/Dashboard'));
        }, 2000);

        return () => clearTimeout(prefetchTimer);
    }, []);

    return (
        <GoogleOAuthProvider clientId="801087464391-ula551k2nsbdlpbt0o0r56jc6pvr8b0m.apps.googleusercontent.com">
            <ErrorBoundary>
                <AuthProvider>
                <ChatNotifProvider>
                <Router>
                    <GlobalToast />
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/mitra-register" element={<MitraRegister />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/privacy" element={<Legal type="privacy" />} />
                        <Route path="/terms" element={<Legal type="terms" />} />
                        <Route path="/support" element={<Legal type="support" />} />

                        {/* Protected Customer Routes */}
                        <Route 
                          path="/explore" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<ExploreVenues />} />
                          <Route path=":id" element={<VenueDetail />} />
                        </Route>
                        <Route 
                          path="/checkout" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<Checkout />} />
                        </Route>
                        <Route 
                          path="/payment/:booking_id" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<Payment />} />
                        </Route>
                        <Route 
                          path="/my-bookings" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<MyBookings />} />
                        </Route>
                        <Route 
                          path="/profile" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<Profile />} />
                        </Route>
                        <Route 
                          path="/notifications" 
                          element={<ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']} />}
                        >
                          <Route index element={<CustomerNotifications />} />
                        </Route>

                        {/* Protected Dashboard Routes */}
                        <Route 
                          path="/dashboard" 
                          element={
                            <ProtectedRoute allowedRoles={['admin', 'super_admin']} />
                          }
                        >
                          <Route element={<DashboardLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="verifications" element={<VenueVerification />} />
                            <Route path="scanner" element={<TicketScanner />} />
                            <Route path="venues" element={<Venues />} />
                            <Route path="bookings" element={<Bookings />} />
                            <Route path="finance" element={<Finance />} />
                            <Route path="users" element={<Users />} />
                            <Route path="chat" element={<Chat />} />
                            <Route path="testimonials" element={<Testimonials />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="areas" element={<Areas />} />
                          </Route>
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<BlankPage title="404 Not Found" />} />
                    </Routes>
                    </Suspense>
                </Router>
                </ChatNotifProvider>
            </AuthProvider>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;
