import React, { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpRight, Loader2, Landmark, Clock, Calendar, CheckCircle2, Building2, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Finance() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [payoutLoading, setPayoutLoading] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  
  const fetchFinance = async () => {
    try {
      setLoading(true);
      const [shareRes, revRes, occRes] = await Promise.all([
        api.get(`/dashboard/revenue-share?period=${period}`),
        api.get(`/dashboard/revenue?period=${period}`),
        api.get(`/dashboard/occupancy?period=${period}`)
      ]);
      setReport(shareRes.data);
      setRevenueData(revRes.data);
      setOccupancyData(occRes.data);
    } catch (error) {
      console.error("Gagal memuat keuangan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();

    // Supabase Realtime Listener for auto-refresh
    const paymentSub = supabase.channel('public:payments_finance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchFinance();
      }).subscribe();
      
    const bookingSub = supabase.channel('public:bookings_finance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchFinance();
      }).subscribe();

    return () => {
      supabase.removeChannel(paymentSub);
      supabase.removeChannel(bookingSub);
    };
  }, [period]);

  const handlePayout = async (ownerId, ownerName, netIncome) => {
    if (netIncome <= 0) {
      alert("Tidak ada saldo yang bisa dicairkan.");
      return;
    }
    
    if (!window.confirm(`Anda akan mentransfer Rp ${netIncome.toLocaleString('id-ID')} ke rekening ${ownerName}.\n\nLanjutkan Proses?`)) return;
    
    setPayoutLoading(ownerId);
    try {
      const res = await api.post(`/dashboard/revenue-share/payout/${ownerId}`);
      alert(`SUKSES!\n${res.data.message}\nTotal Ditransfer: Rp ${res.data.amount_transferred.toLocaleString('id-ID')}\nStatus Gateway: ${res.data.xendit_status}`);
      fetchFinance(); 
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Gagal memproses pencairan dana otomatis.");
    } finally {
      setPayoutLoading(null);
    }
  };

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Math.abs(number || 0));
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <Wallet className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  let totalAvailable = 0;
  let totalGross = 0;
  let totalPlatformFee = 0;
  
  if (user?.role === 'super_admin') {
    totalGross = report?.total_gross || 0;
    totalPlatformFee = report?.total_platform_fee || 0;
    totalAvailable = totalPlatformFee; 
  } else {
    if (report?.items && report.items.length > 0) {
      const myDetail = report.items[0]; 
      totalGross = myDetail.gross_revenue;
      totalPlatformFee = myDetail.platform_fee;
      totalAvailable = myDetail.net_income;
    }
  }

  let totalHourly = 0;
  let totalMonthly = 0;
  if (report?.items) {
    report.items.forEach(item => {
      totalHourly += item.hourly_bookings_count;
      totalMonthly += item.monthly_bookings_count;
    });
  }
  const pieData = [
    { name: 'Regular (Per Jam)', value: totalHourly, color: '#D4AF37' },
    { name: 'Member (Bulanan)', value: totalMonthly, color: '#10b981' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header */}
      <motion.div variants={itemVariants} className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Wallet className="w-8 h-8 text-[#D4AF37]" />
              </div>
              Keuangan & Bagi Hasil
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              {user?.role === 'super_admin' ? 'Pusat monitor arus kas, distribusi pendapatan, dan komisi platform.' : 'Pantau performa finansial dan saldo pendapatan bersih dari penyewaan GOR Anda.'}
            </p>
          </div>
          
          <div className="relative w-full md:w-64 group shrink-0">
            <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#D4AF37] transition-colors pointer-events-none z-10" />
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-white/[0.02] border border-transparent hover:bg-white/[0.04] focus:border-[#D4AF37]/50 text-white text-sm rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10 appearance-none cursor-pointer font-bold transition-all relative z-0"
            >
              <option value="today" className="bg-black">Analisis Hari Ini</option>
              <option value="this_month" className="bg-black">Analisis Bulan Ini</option>
              <option value="last_month" className="bg-black">Analisis Bulan Lalu</option>
              <option value="all" className="bg-black">Sepanjang Waktu (All Time)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards (3D Grid) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/50 z-20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
          </div>
        )}
        
        {/* Card 1: Saldo Utama (Highlight) */}
        <div className="bg-gradient-to-br from-[#D4AF37] to-yellow-500 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(212,175,55,0.3)] transition-all duration-500 sm:col-span-2 md:col-span-1 hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/20 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-black/10 rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none" />
          
          <p className="font-black text-black/70 mb-2 uppercase tracking-widest text-[11px]">
            {user?.role === 'super_admin' ? 'Total Pendapatan Platform (Fee)' : 'Saldo Pendapatan Bersih'}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-6 tracking-tighter">
            {formatIDR(totalAvailable)}
          </h2>
          <div className="inline-flex items-center gap-1.5 text-xs font-black bg-black/10 border border-black/10 px-3 py-1.5 rounded-lg text-black backdrop-blur-sm shadow-inner">
            <CheckCircle2 className="w-4 h-4" />
            <span>TERSEDIA UNTUK DICAIRKAN</span>
          </div>
        </div>

        {/* Card 2: Gross Revenue */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)] hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-7 h-7 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              KOTOR (GROSS)
            </span>
          </div>
          <p className="text-neutral-500 font-bold text-[11px] uppercase tracking-widest mb-1">Total Nilai Transaksi</p>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">{formatIDR(totalGross)}</h3>
        </div>
        
        {/* Card 3: Platform Fee */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-red-500/30 transition-all hover:shadow-[0_15px_40px_rgba(239,68,68,0.15)] hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7 text-red-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg">
              POTONGAN
            </span>
          </div>
          <p className="text-neutral-500 font-bold text-[11px] uppercase tracking-widest mb-1">Total Biaya Platform</p>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">{formatIDR(totalPlatformFee)}</h3>
        </div>
      </motion.div>

      {/* Advanced Analytics Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Chart 1: Tren Pendapatan (Area Chart) */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 sm:p-7 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[60px] pointer-events-none"></div>
          <h3 className="text-base sm:text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
            Visualisasi Tren (7 Hari)
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} tickMargin={10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: '12px' }}
                  itemStyle={{ color: '#D4AF37', fontWeight: '900', fontSize: '16px' }}
                  labelStyle={{ color: '#888', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
                  formatter={(value) => [formatIDR(value), "Pendapatan"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 6, fill: '#000', stroke: '#D4AF37', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* Chart 2: Tipe Booking (Pie Chart) */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 sm:p-7 relative overflow-hidden group hover:border-white/10 transition-all flex flex-col">
            <h3 className="text-xs sm:text-sm font-black text-white mb-2 text-center uppercase tracking-widest relative z-10">Komposisi Transaksi</h3>
            <div className="flex-1 w-full flex items-center justify-center relative z-10 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[11px] font-black uppercase tracking-wider mt-4 relative z-10 bg-white/5 py-2 px-4 rounded-xl">
              <div className="flex items-center gap-2 text-neutral-400"><div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />Reguler</div>
              <div className="flex items-center gap-2 text-neutral-400"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Member</div>
            </div>
          </div>

          {/* Chart 3: Popularitas Lapangan (Bar Chart) */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 sm:p-7 relative overflow-hidden group hover:border-white/10 transition-all flex flex-col">
            <h3 className="text-xs sm:text-sm font-black text-white mb-4 text-center uppercase tracking-widest relative z-10">Trafik Lapangan</h3>
            <div className="flex-1 w-full relative z-10 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="court" type="category" stroke="#ffffff60" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={70} />
                  <RechartsTooltip 
                    cursor={{fill: '#ffffff05'}}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontWeight: 'bold' }}
                    formatter={(value) => [value + " Sesi Terjual", "Volume"]}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16}>
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#ffffff20'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Detailed Finance Breakdown (Card Grid replacement for Table) */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {user?.role === 'super_admin' ? 'Rincian Bagi Hasil Mitra GOR' : 'Detail Akumulasi Keuangan Anda'}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-black/20 z-10 backdrop-blur-sm rounded-3xl flex items-center justify-center"></div>
          )}

          <AnimatePresence mode="popLayout">
            {report?.items?.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[3rem]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5">
                  <Wallet className="w-10 h-10 text-neutral-600" />
                </div>
                <p className="text-white font-black text-2xl mb-2">Belum Ada Perputaran Uang</p>
                <p className="text-neutral-500 text-sm max-w-sm text-center">Tidak ditemukan riwayat pembayaran sukses atau valid pada filter periode ini.</p>
              </motion.div>
            ) : (
              report?.items?.map((detail, idx) => (
                <motion.div 
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="bg-[#0a0a0a] border border-white/5 hover:border-emerald-500/30 rounded-[2rem] p-5 sm:p-6 group hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)] transition-all flex flex-col xl:flex-row xl:items-center gap-6 relative overflow-hidden"
                >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>

                  {/* 1. Profile & Volume */}
                  <div className="w-full xl:w-[30%] flex justify-between items-center xl:items-start xl:flex-col gap-4 border-b xl:border-b-0 xl:border-r border-white/5 pb-5 xl:pb-0 xl:pr-6">
                    <div>
                      <p className="font-black text-white text-lg sm:text-xl tracking-tight mb-2">{detail.owner_name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.venues?.map((v, i) => (
                          <span key={i} className="text-[10px] bg-white/5 text-neutral-400 px-2 py-0.5 rounded-md border border-white/10 font-bold uppercase tracking-widest">{v}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end xl:items-start mt-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">Volume</p>
                      <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-lg px-3 py-1 rounded-xl shadow-inner">{detail.total_bookings} <span className="text-xs">Sesi</span></span>
                    </div>
                  </div>

                  {/* 2. Financials */}
                  <div className="w-full xl:flex-1 flex flex-col gap-3 justify-center">
                    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Pendapatan Kotor</span>
                      <span className="font-black text-white">{formatIDR(detail.gross_revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-500/5 px-4 py-3 rounded-2xl border border-red-500/10">
                      <span className="text-xs font-bold text-red-400/80 uppercase tracking-widest flex items-center gap-2"><ArrowDownToLine className="w-3.5 h-3.5" /> Potongan Platform</span>
                      <span className="font-black text-red-400">- {formatIDR(detail.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 px-4 py-4 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Net Income (Bersih)</span>
                      <span className="font-black text-emerald-400 text-xl">{formatIDR(detail.net_income)}</span>
                    </div>
                  </div>

                  {/* 3. Action */}
                  {user?.role === 'super_admin' && (
                    <div className="w-full xl:w-[30%] flex flex-col sm:flex-row xl:flex-col justify-center gap-4 pt-5 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-6">
                      <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 flex-1 w-full min-w-0">
                        <Landmark className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-white truncate uppercase tracking-widest">{detail.bank_name || 'Bank Belum Diatur'}</p>
                          <p className="text-[11px] text-neutral-400 font-mono mt-1">{detail.bank_account_number || '-'}</p>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">{detail.bank_account_name || 'Tanpa Nama'}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handlePayout(detail.owner_id, detail.owner_name, detail.net_income)}
                        disabled={payoutLoading === detail.owner_id || detail.net_income <= 0}
                        className={`w-full flex-shrink-0 flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-sm font-black transition-all
                          ${detail.net_income > 0 
                            ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105' 
                            : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/10'}`}
                      >
                        {payoutLoading === detail.owner_id ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Proses...</>
                        ) : (
                          <><ArrowUpRight className="w-5 h-5" /> Cairkan Dana</>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  );
}
