import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/dashboard/Dashboard';
import Venues from './pages/dashboard/Venues';
import Bookings from './pages/dashboard/Bookings';
import Finance from './pages/dashboard/Finance';
import Users from './pages/dashboard/Users';
import Chat from './pages/dashboard/Chat';
import Settings from './pages/dashboard/Settings';
import Testimonials from './pages/dashboard/Testimonials';
import Notifications from './pages/dashboard/Notifications';
import Areas from './pages/dashboard/Areas';
import VenueVerification from './pages/dashboard/VenueVerification';
import TicketScanner from './pages/dashboard/TicketScanner';
// Customer Pages
import ExploreVenues from './pages/customer/ExploreVenues';
import VenueDetail from './pages/customer/VenueDetail';
import Checkout from './pages/customer/Checkout';
import Payment from './pages/customer/Payment';
import MyBookings from './pages/customer/MyBookings';
import Profile from './pages/customer/Profile';
import Legal from './pages/public/Legal';
import ErrorBoundary from './components/ErrorBoundary';
import MitraRegister from './pages/MitraRegister';

import { AuthProvider } from './context/AuthContext';
import { ChatNotifProvider } from './context/ChatNotifContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalToast from './components/ui/GlobalToast';

// Komponen Halaman Placeholder (Kosong)
const BlankPage = ({ title }) => (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-gray-400">Halaman ini sedang dalam tahap konstruksi.</p>
        </div>
    </div>
);

function App() {
    return (
        <GoogleOAuthProvider clientId="801087464391-ula551k2nsbdlpbt0o0r56jc6pvr8b0m.apps.googleusercontent.com">
            <ErrorBoundary>
                <AuthProvider>
                <ChatNotifProvider>
                <Router>
                    <GlobalToast />
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
                </Router>
                </ChatNotifProvider>
            </AuthProvider>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;
