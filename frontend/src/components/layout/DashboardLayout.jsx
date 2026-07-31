import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  LayoutDashboard, MapPin, CalendarDays, Users, Wallet,
  MessageSquare, LogOut, Menu, X, ShieldCheck, UserCircle,
  Map, ScanLine, Star, ChevronRight
} from 'lucide-react';
import NotificationBell from '../blocks/NotificationBell';
import { useChatNotif } from '@/context/ChatNotifContext';

const MENU_GRADIENTS = {
  '/dashboard':               { from: '#D4AF37', to: '#f5d778', glow: 'rgba(212,175,55,0.45)'  },
  '/dashboard/verifications': { from: '#f97316', to: '#ef4444', glow: 'rgba(249,115,22,0.45)'  },
  '/dashboard/venues':        { from: '#8b5cf6', to: '#a78bfa', glow: 'rgba(139,92,246,0.45)'  },
  '/dashboard/users':         { from: '#06b6d4', to: '#38bdf8', glow: 'rgba(6,182,212,0.45)'   },
  '/dashboard/areas':         { from: '#10b981', to: '#6ee7b7', glow: 'rgba(16,185,129,0.45)'  },
  '/dashboard/bookings':      { from: '#3b82f6', to: '#93c5fd', glow: 'rgba(59,130,246,0.45)'  },
  '/dashboard/finance':       { from: '#d4af37', to: '#fde68a', glow: 'rgba(212,175,55,0.45)'  },
  '/dashboard/chat':          { from: '#ec4899', to: '#f9a8d4', glow: 'rgba(236,72,153,0.45)'  },
  '/dashboard/testimonials':  { from: '#f43f5e', to: '#fda4af', glow: 'rgba(244,63,94,0.45)'   },
  '/dashboard/settings':      { from: '#94a3b8', to: '#cbd5e1', glow: 'rgba(148,163,184,0.45)' },
  '/dashboard/scanner':       { from: '#22d3ee', to: '#67e8f9', glow: 'rgba(34,211,238,0.45)'  },
};

const LOGOUT_GRAD = { from: '#ef4444', to: '#f87171', glow: 'rgba(239,68,68,0.45)' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount: chatUnread, clearUnread: clearChatUnread } = useChatNotif();
  const location = useLocation();
  const isChatPage = location.pathname === '/dashboard/chat';

  const [expanded, setExpanded]         = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const [tooltip, setTooltip]           = useState(null); // { label, y, grad }
  const expandTimer  = useRef(null);
  const collapseTimer= useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(window.innerWidth < 1024 || isMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      const fetch = async () => {
        try {
          const r = await api.get('/kyc-requests?status=pending');
          setPendingKycCount(r.data.length);
        } catch {}
      };
      fetch();
      const iv = setInterval(fetch, 30000);
      return () => clearInterval(iv);
    }
  }, [user]);

  const getMenuItems = () => {
    if (!user) return [];
    if (user.role === 'super_admin') return [
      { path: '/dashboard',               icon: LayoutDashboard, label: 'Overview'             },
      { path: '/dashboard/verifications', icon: ShieldCheck,     label: 'Verifikasi GOR (KYC)' },
      { path: '/dashboard/users',         icon: Users,           label: 'Manajemen Pengguna'    },
      { path: '/dashboard/areas',         icon: Map,             label: 'Manajemen Area'        },
      { path: '/dashboard/bookings',      icon: CalendarDays,    label: 'Laporan Transaksi'     },
      { path: '/dashboard/finance',       icon: Wallet,          label: 'Bagi Hasil (Revenue)'  },
      { path: '/dashboard/chat',          icon: MessageSquare,   label: 'Pusat Pesan'           },
      { path: '/dashboard/testimonials',  icon: Star,            label: 'Ulasan Pelanggan'      },
      { path: '/dashboard/settings',      icon: UserCircle,      label: 'Pengaturan'            },
    ];
    if (user.role === 'admin') return [
      { path: '/dashboard',               icon: LayoutDashboard, label: 'Statistik GOR'         },
      { path: '/dashboard/scanner',       icon: ScanLine,        label: 'Validasi Tiket (Scan)' },
      { path: '/dashboard/venues',        icon: MapPin,          label: 'Lapangan Saya'         },
      { path: '/dashboard/bookings',      icon: CalendarDays,    label: 'Riwayat Booking'       },
      { path: '/dashboard/finance',       icon: Wallet,          label: 'Keuangan'              },
      { path: '/dashboard/chat',          icon: MessageSquare,   label: 'Pesan & Bantuan'       },
      { path: '/dashboard/testimonials',  icon: Star,            label: 'Ulasan Pelanggan'      },
      { path: '/dashboard/settings',      icon: UserCircle,      label: 'Pengaturan'            },
    ];
    return [];
  };
  const menuItems = getMenuItems();

  const onSidebarEnter = () => {
    clearTimeout(collapseTimer.current);
    expandTimer.current = setTimeout(() => setExpanded(true), 60);
  };
  const onSidebarLeave = () => {
    clearTimeout(expandTimer.current);
    collapseTimer.current = setTimeout(() => { setExpanded(false); setTooltip(null); }, 120);
  };

  const showTooltip = (e, label, grad) => {
    if (expanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, y: rect.top + rect.height / 2, grad });
  };
  const hideTooltip = () => setTooltip(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const actualExpanded = isMobile ? true : expanded;
  const sidebarW = isMobile ? 260 : (actualExpanded ? 256 : 68);

  return (
    <div className="h-screen min-h-[100dvh] bg-[#080808] text-white flex flex-row overflow-hidden font-sans w-full">

          MOBILE OVERLAY
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

          GLOBAL TOOLTIP (rendered outside aside)
      {tooltip && !actualExpanded && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-2 rounded-xl text-[12px] font-bold text-white whitespace-nowrap"
          style={{
            left: 76,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            background: 'rgba(16,16,16,0.97)',
            border: `1px solid ${tooltip.grad.from}50`,
            boxShadow: `0 6px 28px rgba(0,0,0,0.8), 0 0 12px ${tooltip.grad.glow}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Arrow */}
          <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: `6px solid ${tooltip.grad.from}50`,
            }}
          />
          {tooltip.label}
        </div>
      )}

          SIDEBAR
      <aside
        onMouseEnter={isMobile ? undefined : onSidebarEnter}
        onMouseLeave={isMobile ? undefined : onSidebarLeave}
        className={`flex inset-y-0 left-0 z-[100] flex-col flex-shrink-0 transition-all duration-300 ease-out ${isMobile ? 'fixed h-full' : 'relative'} ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          background: 'linear-gradient(180deg,#0e0e0e 0%,#0a0a0a 60%,#0e0e0e 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: actualExpanded ? '6px 0 40px rgba(0,0,0,0.6)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Top ambient */}
        <div className="absolute top-0 inset-x-0 h-28 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />

        {/* ── HEADER ── */}
        <div className="h-[72px] flex items-center gap-3 px-[18px] flex-shrink-0 overflow-hidden"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_18px_rgba(212,175,55,0.2)] bg-black/20">
              <img src="/Logo.svg" alt="JogjaCourt" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Brand text */}
          <div className="flex flex-col overflow-hidden"
            style={{
              opacity: actualExpanded ? 1 : 0,
              width:   actualExpanded ? 180 : 0,
              transition: 'opacity 250ms, width 360ms cubic-bezier(0.32,0.72,0,1)',
              whiteSpace: 'nowrap',
            }}>
            <span className="font-black text-[14px] leading-none text-white">JogjaCourt</span>
            <span className="text-[9px] text-[#D4AF37]/60 mt-[3px] uppercase tracking-[0.18em] font-semibold capitalize">
              {user?.role?.replace('_', ' ')} Panel
            </span>
          </div>

          {isMobile && (
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="px-[18px] pt-5 pb-2 flex-shrink-0 overflow-hidden h-10 flex items-center">
          <span className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.2em] whitespace-nowrap"
            style={{
              opacity: actualExpanded ? 1 : 0,
              transition: 'opacity 250ms',
            }}>
            Menu Utama
          </span>
          {!actualExpanded && (
            <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)' }} />
          )}
        </div>

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-4" style={{ scrollbarWidth: 'none' }}>
          {menuItems.map((item) => {
            const grad       = MENU_GRADIENTS[item.path] || MENU_GRADIENTS['/dashboard'];
            const Icon       = item.icon;
            const hasBadge   = item.path === '/dashboard/verifications' && pendingKycCount > 0;
            const hasChatBdg = item.path === '/dashboard/chat' && chatUnread > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => { 
                  if (item.path === '/dashboard/chat') clearChatUnread(); 
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className="block group"
              >
                {({ isActive }) => (
                  <div
                    className={`relative mx-2 my-0.5 rounded-md transition-colors duration-200 cursor-pointer ${
                      isActive ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                    }`}
                    onMouseEnter={(e) => showTooltip(e, item.label, grad)}
                    onMouseLeave={hideTooltip}
                  >

                    {/* Row */}
                    <div className={`flex items-center transition-all duration-300 ${actualExpanded ? 'justify-start gap-3 px-3 py-2' : 'justify-center gap-0 py-2 px-0'}`}>
                      {/* Icon */}
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
                        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                        {(hasBadge || hasChatBdg) && (
                          <span className="absolute -top-1 -right-1 w-[8px] h-[8px] rounded-full bg-red-500 border-[1.5px] border-[#0a0a0a]" />
                        )}
                      </span>

                      {/* Label */}
                      <span className="text-[13px] tracking-wide whitespace-nowrap transition-all duration-300"
                        style={{
                          opacity:   actualExpanded ? 1 : 0,
                          maxWidth:  actualExpanded ? 160 : 0,
                          overflow:  'hidden',
                        }}>
                        {item.label}
                      </span>

                      {/* Expanded badges */}
                      {actualExpanded && hasBadge && (
                        <span className="ml-auto text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md whitespace-nowrap">
                          {pendingKycCount} Baru
                        </span>
                      )}
                      {actualExpanded && hasChatBdg && (
                        <span className="ml-auto text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-md whitespace-nowrap">
                          {chatUnread} Pesan
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── DIVIDER ── */}
        <div className="mx-4 h-px flex-shrink-0"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />

        {/* ── LOGOUT ── */}
        <div className="p-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => showTooltip(e, 'Keluar Akun', LOGOUT_GRAD)}
            onMouseLeave={hideTooltip}
            className={`group relative w-full flex items-center rounded-md transition-colors duration-200 text-neutral-400 hover:bg-white/5 hover:text-neutral-200 ${actualExpanded ? 'justify-start gap-3 px-3 py-2' : 'justify-center gap-0 py-2 px-0'}`}
          >
            {/* Icon */}
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center relative">
              <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            </span>

            {/* Label */}
            <span className="text-[13px] whitespace-nowrap transition-all duration-300"
              style={{
                opacity:  actualExpanded ? 1 : 0,
                maxWidth: actualExpanded ? 160 : 0,
                overflow: 'hidden',
              }}>
              Keluar Akun
            </span>
          </button>
        </div>

        {/* Bottom ambient */}
        <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(239,68,68,0.05) 0%,transparent 70%)' }} />
      </aside>

          MAIN CONTENT
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-[72px] flex-shrink-0 flex items-center justify-between px-3 sm:px-6 z-30 relative"
          style={{ background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all mr-1 sm:mr-2"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-1 h-4 sm:h-5 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg,#D4AF37,#f5d778)' }} />
              <h2 className="text-[12px] sm:text-[15px] font-black text-white tracking-tight truncate">Dashboard</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link to="/dashboard/chat"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              onClick={clearChatUnread}>
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full border border-[#080808] sm:border-2 animate-pulse flex items-center justify-center text-[6px] sm:text-[7px] font-black text-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </Link>

            <NotificationBell />

            <Link to="/dashboard/settings" className="flex items-center gap-1.5 sm:gap-2.5 pl-2 sm:pl-4 border-l border-white/10 hover:opacity-80 transition-opacity min-w-0">
              <div className="text-right">
                <p className="text-[10px] sm:text-[13px] font-black text-white leading-none truncate max-w-[60px] sm:max-w-[130px]">{user?.name}</p>
                <p className="text-[8px] sm:text-[10px] text-neutral-500 mt-0.5 truncate max-w-[60px] sm:max-w-[130px]">{user?.email}</p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ border: '2px solid rgba(212,175,55,0.4)', boxShadow: '0 0 12px rgba(212,175,55,0.2)' }}>
                {user?.profile_image
                  ? <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  : <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]/60" />}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto scroll-smooth ${isChatPage ? 'p-0' : 'p-3 sm:p-6 md:p-8 pb-8'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
