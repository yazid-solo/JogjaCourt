import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  CreditCard,
  Loader2,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { motion, useSpring, useTransform, AnimatePresence, useMotionValue } from 'framer-motion';

// --- Komponen Angka Berjalan (Animated Counter) ---
function AnimatedNumber({ value }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.round(current))
  );

  useEffect(() => {
    spring.set(value || 0);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedInteger({ value, suffix = "" }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current) + suffix);

  useEffect(() => {
    spring.set(value || 0);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

// --- Komponen 3D Tilt Card (Gahar & Realistis) ---
function TiltCard({ children, className = "", highlightColor = "rgba(212, 175, 55, 0.15)" }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      className="w-full h-full"
    >
      <motion.div
        onMouseMove={handleMouse}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        className={`relative overflow-hidden rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md p-6 transition-all duration-300 shadow-2xl ${className}`}
        whileHover={{ scale: 1.02, borderColor: highlightColor, boxShadow: `0 20px 40px -10px ${highlightColor}` }}
      >
        {/* Glow Element */}
        <motion.div
          className="absolute -inset-px opacity-0 transition duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at calc(50% + ${x.get()}px) calc(50% + ${y.get()}px), ${highlightColor}, transparent 40%)`,
          }}
          whileHover={{ opacity: 1 }}
        />
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fungsi Fetch Data
  const fetchData = async (isInitial = false) => {
    try {
      if (!isInitial) setIsUpdating(true);
      
      const [statsRes, revenueRes, bookingsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/revenue'),
        api.get('/bookings')
      ]);
      
      setStats(statsRes.data);
      
      if (revenueRes.data && Array.isArray(revenueRes.data)) {
        setRevenueData(revenueRes.data);
      }

      const bData = bookingsRes.data?.data || bookingsRes.data;
      if (bData && Array.isArray(bData)) {
        setRecentBookings(bData.slice(0, 5));
      }

    } catch (error) {
      console.error("Gagal memuat data dashboard", error);
    } finally {
      if (isInitial) setLoading(false);
      setTimeout(() => setIsUpdating(false), 800); // Visual cue delay
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData(true);

    // Silent Polling setiap 60 detik (Real-time pseudo)
    const interval = setInterval(() => {
      fetchData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Loader2 className="w-12 h-12 text-[#D4AF37]" />
        </motion.div>
      </div>
    );
  }

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'pending':
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20"><Clock className="w-3 h-3" /> Pending</span>;
      case 'cancelled':
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-500/10 px-2 py-1 rounded-md border border-white/5">{status}</span>;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-neutral-400 text-xs mb-1 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-[#D4AF37] font-black text-lg">
            {formatIDR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-neutral-400 tracking-tight">
            Halo, {user?.name || user?.username}! 👋
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-2 font-medium">
            Performa <span className="text-[#D4AF37]">{user?.role === 'super_admin' ? 'Aplikasi JogjaCourt' : 'Mitra GOR'}</span> hari ini.
          </p>
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)} 
            disabled={isUpdating} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-neutral-400 transition-colors disabled:opacity-50"
          >
             <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
             SYNC
          </button>
          
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 w-fit">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Auto 60s</span>
            <AnimatePresence>
              {isUpdating && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Activity className="w-3 h-3 text-emerald-500 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3D Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pendapatan */}
        <TiltCard highlightColor="rgba(212, 175, 55, 0.3)">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-wider mb-1">Total Pendapatan</p>
              <h3 className="text-2xl sm:text-4xl font-black text-white break-words drop-shadow-md leading-tight">
                <AnimatedNumber value={stats?.total_revenue_today} />
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-[#D4AF37]" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> Auto Sync
            </span>
          </div>
        </TiltCard>

        {/* Card 2: Booking */}
        <TiltCard highlightColor="rgba(59, 130, 246, 0.3)">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-wider mb-1">Booking Berhasil</p>
              <h3 className="text-2xl sm:text-4xl font-black text-white break-words drop-shadow-md leading-tight">
                <AnimatedInteger value={stats?.total_bookings_today} /> <span className="text-sm sm:text-lg text-neutral-500 font-medium">Sesi</span>
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center shadow-lg">
              <CalendarCheck className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">
              Real-time update
            </span>
          </div>
        </TiltCard>

        {/* Card 3: Pending */}
        <TiltCard highlightColor="rgba(249, 115, 22, 0.3)">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-bold text-xs uppercase tracking-wider mb-1">Menunggu Bayar</p>
              <h3 className="text-2xl sm:text-4xl font-black text-white break-words drop-shadow-md leading-tight">
                <AnimatedInteger value={stats?.pending_payments_count} /> <span className="text-sm sm:text-lg text-neutral-500 font-medium">Pesanan</span>
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center shadow-lg">
              <CreditCard className="w-7 h-7 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <span className={`${stats?.pending_payments_count > 0 ? 'text-orange-400 bg-orange-500/10' : 'text-neutral-400 bg-white/5'} px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors`}>
              {stats?.pending_payments_count > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </TiltCard>
      </div>

      {/* Charts & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Chart Section */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="lg:col-span-2 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 flex flex-col min-h-[420px] min-w-0 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-xl font-black text-white tracking-tight">Tren Pendapatan</h3>
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">7 Hari Terakhir</span>
          </div>
          <div className="flex-1 w-full relative z-10">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff0a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dy={15}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff03'}} />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorRevenue)" 
                    radius={[8, 8, 0, 0]} 
                    barSize={45}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 font-medium">
                Data sedang diolah atau belum tersedia.
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Recent Bookings Section */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 flex flex-col min-h-[420px] min-w-0 shadow-2xl relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xl font-black text-white tracking-tight">Booking Live</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {recentBookings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-2xl">
                <CalendarCheck className="w-10 h-10 text-neutral-600 mb-3" />
                <p className="text-xs text-neutral-500 font-medium">Belum ada booking yang masuk hari ini.</p>
              </div>
            ) : (
              <AnimatePresence>
                {recentBookings.map((b, idx) => (
                  <motion.div 
                    key={b.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-center gap-4 p-4 bg-black/40 hover:bg-white/5 rounded-2xl border border-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-[#D4AF37]/50 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
                      {b.user?.profile_image ? (
                        <img src={b.user.profile_image} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Users className="w-5 h-5 text-neutral-400 group-hover:text-[#D4AF37] transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate tracking-tight">{b.user?.name || b.user?.email || 'Guest'}</h4>
                      <p className="text-[11px] font-medium text-neutral-400 truncate mt-0.5">
                        {b.court?.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                        {new Date(b.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(b.status)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
