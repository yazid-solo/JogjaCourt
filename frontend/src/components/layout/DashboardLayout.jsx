import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [expanded, setExpanded]         = useState(false);
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const [tooltip, setTooltip]           = useState(null); // { label, y, grad }
  const expandTimer  = useRef(null);
  const collapseTimer= useRef(null);

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
    if (expanded || sidebarOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, y: rect.top + rect.height / 2, grad });
  };
  const hideTooltip = () => setTooltip(null);

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarW = expanded ? 256 : 68;

  return (
    <div className="h-screen bg-[#080808] text-white flex overflow-hidden font-sans">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-md"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════════════════
          GLOBAL TOOLTIP (rendered outside aside)
          ══════════════════════════════════════════ */}
      {tooltip && !expanded && !sidebarOpen && (
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

      {/* ══════════════════════════════════════════
          SIDEBAR
          ══════════════════════════════════════════ */}
      <aside
        onMouseEnter={onSidebarEnter}
        onMouseLeave={onSidebarLeave}
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col flex-shrink-0
          transition-[width] duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: sidebarOpen ? 260 : sidebarW,
          minWidth: sidebarOpen ? 260 : sidebarW,
          background: 'linear-gradient(180deg,#0e0e0e 0%,#0a0a0a 60%,#0e0e0e 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: expanded ? '6px 0 40px rgba(0,0,0,0.6)' : 'none',
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
              opacity: expanded || sidebarOpen ? 1 : 0,
              width:   expanded || sidebarOpen ? 180 : 0,
              transition: 'opacity 250ms, width 360ms cubic-bezier(0.32,0.72,0,1)',
              whiteSpace: 'nowrap',
            }}>
            <span className="font-black text-[14px] leading-none text-white">JogjaCourt</span>
            <span className="text-[9px] text-[#D4AF37]/60 mt-[3px] uppercase tracking-[0.18em] font-semibold capitalize">
              {user?.role?.replace('_', ' ')} Panel
            </span>
          </div>

          {/* Mobile close */}
          <button className="lg:hidden ml-auto w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all flex-shrink-0"
            onClick={() => setSidebarOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="px-[18px] pt-5 pb-2 flex-shrink-0 overflow-hidden h-10 flex items-center">
          <span className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.2em] whitespace-nowrap"
            style={{
              opacity: expanded || sidebarOpen ? 1 : 0,
              transition: 'opacity 250ms',
            }}>
            Menu Utama
          </span>
          {!expanded && !sidebarOpen && (
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
                onClick={() => { setSidebarOpen(false); if (item.path === '/dashboard/chat') clearChatUnread(); }}
                className="block group"
              >
                {({ isActive }) => (
                  <div
                    className="relative mx-2 my-[2px] rounded-[14px] transition-all duration-300 cursor-pointer"
                    onMouseEnter={(e) => showTooltip(e, item.label, grad)}
                    onMouseLeave={hideTooltip}
                    style={isActive ? {
                      background: `linear-gradient(135deg,${grad.from}18,${grad.to}08)`,
                      border: `1px solid ${grad.from}30`,
                      boxShadow: `0 2px 16px ${grad.glow}20`,
                    } : { border: '1px solid transparent' }}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                        style={{ height: '55%', background: `linear-gradient(180deg,${grad.from},${grad.to})`, boxShadow: `0 0 8px ${grad.glow}` }} />
                    )}

                    {/* Hover shimmer */}
                    <span className="absolute inset-0 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `linear-gradient(135deg,${grad.from}0d,transparent)` }} />

                    {/* Row */}
                    <div className={`flex items-center transition-all duration-300 ${expanded || sidebarOpen ? 'justify-start gap-3 px-[14px] py-[10px]' : 'justify-center gap-0 p-2.5'}`}>
                      {/* Icon pill */}
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 relative"
                        style={isActive ? {
                          background: `linear-gradient(135deg,${grad.from},${grad.to})`,
                          boxShadow: `0 4px 14px ${grad.glow}`,
                        } : {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <Icon style={{ width: 14, height: 14, color: isActive ? '#000' : 'rgba(255,255,255,0.5)', transition: 'color .25s' }} />
                        {(hasBadge || hasChatBdg) && (
                          <span className="absolute -top-1 -right-1 w-[10px] h-[10px] rounded-full border-[1.5px] border-[#0a0a0a] animate-pulse"
                            style={{ background: hasChatBdg ? '#ef4444' : '#f97316' }} />
                        )}
                      </span>

                      {/* Label */}
                      <span className="text-[13px] font-semibold tracking-wide whitespace-nowrap transition-all duration-300"
                        style={{
                          opacity:   expanded || sidebarOpen ? 1 : 0,
                          maxWidth:  expanded || sidebarOpen ? 160 : 0,
                          overflow:  'hidden',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                        }}>
                        {item.label}
                      </span>

                      {/* Expanded badges */}
                      {(expanded || sidebarOpen) && hasBadge && (
                        <span className="ml-auto text-[8px] font-black text-white px-1.5 py-0.5 rounded-full whitespace-nowrap animate-pulse"
                          style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)', boxShadow: '0 0 8px rgba(249,115,22,0.5)' }}>
                          {pendingKycCount > 9 ? '9+' : pendingKycCount}
                        </span>
                      )}
                      {(expanded || sidebarOpen) && hasChatBdg && (
                        <span className="ml-auto text-[8px] font-black text-white px-1.5 py-0.5 rounded-full whitespace-nowrap animate-pulse"
                          style={{ background: 'linear-gradient(135deg,#ef4444,#ec4899)', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </span>
                      )}

                      {/* Chevron */}
                      {isActive && (expanded || sidebarOpen) && (
                        <ChevronRight className="ml-auto flex-shrink-0" style={{ width: 12, height: 12, color: grad.from, opacity: .7 }} />
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
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => showTooltip(e, 'Keluar Akun', LOGOUT_GRAD)}
            onMouseLeave={hideTooltip}
            className={`group relative w-full flex items-center rounded-[14px] transition-all duration-300 ${expanded || sidebarOpen ? 'justify-start gap-3 px-[14px] py-[10px]' : 'justify-center gap-0 p-[6px]'}`}
            style={{ border: '1px solid rgba(239,68,68,0.12)' }}
          >
            <span className="absolute inset-0 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.04))' }} />

            {/* Icon */}
            <span className="flex-shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <LogOut style={{ width: 14, height: 14, color: 'rgba(248,113,113,0.8)' }} />
            </span>

            {/* Label */}
            <span className="text-[13px] font-semibold whitespace-nowrap transition-all duration-300"
              style={{
                opacity:  expanded || sidebarOpen ? 1 : 0,
                maxWidth: expanded || sidebarOpen ? 160 : 0,
                overflow: 'hidden',
                color: 'rgba(248,113,113,0.75)',
              }}>
              Keluar Akun
            </span>
          </button>
        </div>

        {/* Bottom ambient */}
        <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%,rgba(239,68,68,0.05) 0%,transparent 70%)' }} />
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-[72px] flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-30 relative"
          style={{ background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg,#D4AF37,#f5d778)' }} />
              <h2 className="text-[15px] font-black text-white tracking-tight">Dashboard</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard/chat"
              className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              onClick={clearChatUnread}>
              <MessageSquare className="w-4 h-4" />
              {chatUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#080808] animate-pulse flex items-center justify-center text-[7px] font-black text-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </Link>

            <NotificationBell />

            <Link to="/dashboard/settings" className="flex items-center gap-2.5 pl-4 border-l border-white/10 hover:opacity-80 transition-opacity">
              <div className="hidden md:block text-right">
                <p className="text-[13px] font-black text-white leading-none truncate max-w-[130px]">{user?.name}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5 truncate max-w-[130px]">{user?.email}</p>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ border: '2px solid rgba(212,175,55,0.4)', boxShadow: '0 0 12px rgba(212,175,55,0.2)' }}>
                {user?.profile_image
                  ? <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  : <UserCircle className="w-5 h-5 text-[#D4AF37]/60" />}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-28 lg:pb-8 scroll-smooth">
          <Outlet />
        </div>
      </main>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM NAV
          ══════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 py-2 safe-area-pb"
        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }}>
        {menuItems.slice(0, 5).map((item) => {
          const grad   = MENU_GRADIENTS[item.path] || MENU_GRADIENTS['/dashboard'];
          const Icon   = item.icon;
          const hasBdg = (item.path === '/dashboard/chat' && chatUnread > 0)
                      || (item.path === '/dashboard/verifications' && pendingKycCount > 0);

          return (
            <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'}
              onClick={() => { setSidebarOpen(false); if (item.path === '/dashboard/chat') clearChatUnread(); }}>
              {({ isActive }) => (
                <div className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300">
                  {isActive && (
                    <span className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: `linear-gradient(135deg,${grad.from}18,${grad.to}08)`, border: `1px solid ${grad.from}30` }} />
                  )}
                  <span className="relative w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300"
                    style={isActive
                      ? { background: `linear-gradient(135deg,${grad.from},${grad.to})`, boxShadow: `0 4px 12px ${grad.glow}` }
                      : { background: 'rgba(255,255,255,0.04)' }}>
                    <Icon style={{ width: 15, height: 15, color: isActive ? '#000' : 'rgba(255,255,255,0.4)' }} />
                    {hasBdg && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#0a0a0a] animate-pulse" />}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase leading-none"
                    style={{ color: isActive ? grad.from : 'rgba(255,255,255,0.28)' }}>
                    {item.label.split(' ')[0]}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
}
