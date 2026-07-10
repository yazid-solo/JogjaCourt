import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  LayoutDashboard, 
  MapPin, 
  CalendarDays, 
  Users, 
  Wallet, 
  MessageSquare, 
  LogOut, 
  Menu,
  X,
  Bell,
  ShieldCheck,
  UserCircle,
  Map,
  ScanLine
} from 'lucide-react';
import NotificationBell from '../blocks/NotificationBell';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingKycCount, setPendingKycCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      const fetchKycCount = async () => {
        try {
          const res = await api.get('/kyc-requests?status=pending');
          setPendingKycCount(res.data.length);
        } catch (error) {
          console.error("Gagal fetch KYC count", error);
        }
      };
      fetchKycCount();
      // Optional: Polling every 30 seconds
      const interval = setInterval(fetchKycCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Definisi Menu berdasarkan Role
  const getMenuItems = () => {
    if (!user) return [];
    
    if (user.role === 'super_admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/verifications', icon: ShieldCheck, label: 'Verifikasi GOR (KYC)' },
        { path: '/dashboard/venues', icon: MapPin, label: 'Manajemen GOR' },
        { path: '/dashboard/users', icon: Users, label: 'Manajemen Pengguna' },
        { path: '/dashboard/areas', icon: Map, label: 'Manajemen Area' },
        { path: '/dashboard/bookings', icon: CalendarDays, label: 'Laporan Transaksi' },
        { path: '/dashboard/finance', icon: Wallet, label: 'Bagi Hasil (Revenue)' },
        { path: '/dashboard/chat', icon: MessageSquare, label: 'Pusat Pesan / Chat' },
        { path: '/dashboard/testimonials', icon: MessageSquare, label: 'Ulasan Pelanggan' },
        { path: '/dashboard/settings', icon: UserCircle, label: 'Pengaturan' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Statistik GOR' },
        { path: '/dashboard/scanner', icon: ScanLine, label: 'Validasi Tiket (Scan)' },
        { path: '/dashboard/venues', icon: MapPin, label: 'Lapangan Saya' },
        { path: '/dashboard/bookings', icon: CalendarDays, label: 'Riwayat Booking' },
        { path: '/dashboard/finance', icon: Wallet, label: 'Keuangan' },
        { path: '/dashboard/chat', icon: MessageSquare, label: 'Pesan & Bantuan' },
        { path: '/dashboard/testimonials', icon: MessageSquare, label: 'Ulasan Pelanggan' },
        { path: '/dashboard/settings', icon: UserCircle, label: 'Pengaturan' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#111] border-r border-white/5 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">JogjaCourt</h1>
              <p className="text-xs text-neutral-400 mt-1 capitalize">{user?.role?.replace('_', ' ')} Panel</p>
            </div>
          </div>
          <button 
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <p className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            Menu Utama
          </p>
          
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' 
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.label}</span>
              {item.path === '/dashboard/verifications' && pendingKycCount > 0 && (
                 <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingKycCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full text-left text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 flex-shrink-0 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 z-30 relative">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white hidden sm:block">Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            
            <Link to="/dashboard/settings" className="flex items-center gap-3 pl-6 border-l border-white/10 hover:opacity-80 transition-opacity">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                <p className="text-xs text-neutral-400 mt-1">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-6 h-6 text-neutral-400" />
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Outlet / Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
