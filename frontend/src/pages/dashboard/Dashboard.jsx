import React, { useEffect, useState } from 'react';
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
  XCircle
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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, bookingsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/revenue'),
          api.get('/bookings')
        ]);
        
        setStats(statsRes.data);
        
        // Format revenue data for recharts
        if (revenueRes.data && Array.isArray(revenueRes.data)) {
          setRevenueData(revenueRes.data);
        }

        // Get 5 most recent bookings
        if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
          // Assuming bookings come sorted by created_at desc, otherwise we slice the first 5
          setRecentBookings(bookingsRes.data.slice(0, 5));
        }

      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  // Format mata uang Rupiah
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
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'pending':
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md"><Clock className="w-3 h-3" /> Pending</span>;
      case 'cancelled':
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-500/10 px-2 py-1 rounded-md">{status}</span>;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-neutral-400 text-xs mb-1">{label}</p>
          <p className="text-[#D4AF37] font-bold text-sm">
            {formatIDR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-black text-white">
          Halo, {user?.name || user?.username}! 👋
        </h1>
        <p className="text-neutral-400 mt-2">
          Berikut adalah ringkasan performa {user?.role === 'super_admin' ? 'aplikasi JogjaCourt' : 'GOR Anda'} hari ini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pendapatan Hari Ini */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-medium text-sm">Pendapatan Hari Ini</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {formatIDR(stats?.total_revenue_today)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-bold flex items-center gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
            <span className="text-neutral-500 text-xs">Pembaruan otomatis</span>
          </div>
        </div>

        {/* Card 2: Booking Hari Ini */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-medium text-sm">Total Booking Hari Ini</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {stats?.total_bookings_today || 0} <span className="text-lg text-neutral-500 font-normal">Sesi</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-400 text-xs">Sesi main yang tidak dibatalkan</span>
          </div>
        </div>

        {/* Card 3: Pembayaran Pending */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-neutral-400 font-medium text-sm">Menunggu Pembayaran</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {stats?.pending_payments_count || 0} <span className="text-lg text-neutral-500 font-normal">Pesanan</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {stats?.pending_payments_count > 0 ? (
              <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md font-bold text-xs">
                Action Required
              </span>
            ) : (
              <span className="text-neutral-500 bg-neutral-500/10 px-2 py-1 rounded-md font-bold text-xs">
                All Clear
              </span>
            )}
            <span className="text-neutral-500 text-xs">Belum lunas (Kadaluarsa max 15m)</span>
          </div>
        </div>

      </div>

      {/* Charts & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Grafik Pendapatan (7 Hari Terakhir)</h3>
          </div>
          <div className="flex-1 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `Rp ${value / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#D4AF37" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500">
                Belum ada data pendapatan.
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Bookings Section */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Booking Terbaru</h3>
            <span className="text-xs text-[#D4AF37] font-medium px-2 py-1 bg-[#D4AF37]/10 rounded-lg">Live</span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {recentBookings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-xl">
                <CalendarCheck className="w-8 h-8 text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-500">Belum ada booking yang masuk.</p>
              </div>
            ) : (
              recentBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-black/40 hover:bg-white/5 rounded-xl border border-white/5 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Users className="w-5 h-5 text-neutral-400 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{b.user?.name || b.user?.email || 'Guest'}</h4>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {b.court?.name} - {new Date(b.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(b.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
