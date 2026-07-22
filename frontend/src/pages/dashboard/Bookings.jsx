import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Search, CalendarDays, CheckCircle, XCircle, Clock, Repeat, Plus, Receipt, UserCircle, MapPin, Download, Edit3, Save, Eye, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('all');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // View Report Modal State (Super Admin)
  const [viewReportModal, setViewReportModal] = useState(null);
  
  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    venue: 'all',
    period: 'all'
  });
  
  // Recurring Modal State
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringForm, setRecurringForm] = useState({
    user_email: '',
    court_id: '',
    start_date: '',
    end_date: '',
    day_of_week: '0',
    start_time: '',
    end_time: ''
  });

  const { user } = useAuth();

  const fetchBookings = async (currentPage = page) => {
    try {
      const [resBookings, resCourts] = await Promise.all([
        api.get(`/bookings?page=${currentPage}&size=50`),
        api.get('/courts')
      ]);
      setBookings(resBookings.data.data || []);
      setTotalPages(resBookings.data.total_pages || 1);
      setTotalCount(resBookings.data.total_count || 0);
      setCourts(resCourts.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page);

    // Supabase Realtime Listener for auto-refresh
    const paymentSub = supabase.channel('public:payments_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchBookings(page);
      }).subscribe();
      
    const bookingSub = supabase.channel('public:bookings_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings(page);
      }).subscribe();

    return () => {
      supabase.removeChannel(paymentSub);
      supabase.removeChannel(bookingSub);
    };
  }, [page]);

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...recurringForm,
        day_of_week: parseInt(recurringForm.day_of_week),
        start_time: recurringForm.start_time.length === 5 ? `${recurringForm.start_time}:00` : recurringForm.start_time,
        end_time: recurringForm.end_time.length === 5 ? `${recurringForm.end_time}:00` : recurringForm.end_time,
      };
      
      const res = await api.post('/bookings/recurring', payload);
      alert(`Sukses! ${res.data.length} jadwal rutin berhasil dibuat.`);
      setShowRecurringModal(false);
      setRecurringForm({ user_email: '', court_id: '', start_date: '', end_date: '', day_of_week: '0', start_time: '', end_time: '' });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal membuat pesanan rutin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsUpdating(true);
    try {
      await api.put(`/bookings/${editingBooking.id}/admin`, {
        status: editingBooking.status,
        total_price: parseFloat(editingBooking.total_price)
      });
      alert("Sukses mengupdate pesanan!");
      setEditingBooking(null);
      fetchBookings();
    } catch(err) {
      alert(err.response?.data?.detail || "Gagal mengupdate pesanan");
    } finally {
      setIsUpdating(false);
    }
  };

  const generateExcel = async (data, fileName) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Transaksi');

    worksheet.columns = [
      { header: 'ID Pesanan', key: 'id', width: 15 },
      { header: 'Tanggal Booking', key: 'date', width: 20 },
      { header: 'Waktu (Jam)', key: 'time', width: 18 },
      { header: 'Pelanggan', key: 'user', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mitra GOR', key: 'venue', width: 25 },
      { header: 'Lapangan', key: 'court', width: 18 },
      { header: 'Tipe Booking', key: 'type', width: 15 },
      { header: 'Total Transaksi', key: 'price', width: 20, style: { numFmt: '"Rp"#,##0' } },
      { header: 'Status', key: 'status', width: 15 }
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    data.forEach((b, index) => {
      const bookingDateStr = b.booking_date ? new Date(b.booking_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(b.start_time).toLocaleDateString('id-ID');
      const timeStr = b.start_time && b.end_time ? `${b.start_time.substring(0, 5)} - ${b.end_time.substring(0, 5)}` : 'Full Access';
      
      const row = worksheet.addRow({
        id: b.id.substring(0, 8).toUpperCase(),
        date: bookingDateStr,
        time: timeStr,
        user: b.user?.name || 'Anonim',
        email: b.user?.email || '-',
        venue: b.court?.venue?.name || '-',
        court: b.court?.name || '-',
        type: b.booking_type === 'monthly' ? 'Member (Rutin)' : 'Reguler',
        price: parseFloat(b.total_price) || 0,
        status: b.status.toUpperCase()
      });

      if (index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };

      const statusCell = row.getCell('status');
      statusCell.font = { bold: true };
      if (b.status === 'confirmed' || b.status === 'completed') {
          statusCell.font.color = { argb: 'FF00A65A' };
      } else if (b.status === 'pending') {
          statusCell.font.color = { argb: 'FFF39C12' };
      } else {
          statusCell.font.color = { argb: 'FFDD4B39' };
      }
    });

    worksheet.eachRow((row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  const handleDirectDownload = async (venueName) => {
    let dataToDownload = bookings.filter(b => b.court?.venue?.name === venueName);
    if (dataToDownload.length === 0) {
      alert("Tidak ada data transaksi untuk GOR tersebut.");
      return;
    }
    const fileName = `Laporan_Transaksi_${venueName.replace(/\s+/g, '_')}.xlsx`;
    await generateExcel(dataToDownload, fileName);
    alert(`Laporan Excel untuk ${venueName} sedang diunduh!`);
  };

  const handleDownloadCSV = async () => {
    let dataToDownload = bookings;
    if (downloadFilters.venue !== 'all') {
      dataToDownload = dataToDownload.filter(b => b.court?.venue?.name === downloadFilters.venue);
    }
    
    if (downloadFilters.period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dataToDownload = dataToDownload.filter(b => (b.booking_date || b.start_time).startsWith(today));
    } else if (downloadFilters.period === 'this_month') {
      const thisMonth = new Date().toISOString().substring(0, 7);
      dataToDownload = dataToDownload.filter(b => (b.booking_date || b.start_time).startsWith(thisMonth));
    }

    if (dataToDownload.length === 0) {
      alert("Tidak ada data untuk kombinasi filter tersebut.");
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Rekap_Transaksi_JogjaCourt_${dateStr}.xlsx`;
    
    await generateExcel(dataToDownload, fileName);
    setShowDownloadModal(false);
  };

  const getDownloadPreviewCount = () => {
    let dataToDownload = bookings;
    if (downloadFilters.venue !== 'all') dataToDownload = dataToDownload.filter(b => b.court?.venue?.name === downloadFilters.venue);
    if (downloadFilters.period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dataToDownload = dataToDownload.filter(b => (b.booking_date || b.start_time).startsWith(today));
    } else if (downloadFilters.period === 'this_month') {
      const thisMonth = new Date().toISOString().substring(0, 7);
      dataToDownload = dataToDownload.filter(b => (b.booking_date || b.start_time).startsWith(thisMonth));
    }
    return dataToDownload.length;
  };

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.15)]"><CheckCircle className="w-3.5 h-3.5" /> Berhasil</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-black tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5 animate-pulse" /> Pending</span>;
      case 'cancelled':
      case 'expired':
        return <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-black tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full"><XCircle className="w-3.5 h-3.5" /> Batal</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-black tracking-wider text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-3 py-1.5 rounded-full">{status}</span>;
    }
  };

  const uniqueVenues = [...new Set(bookings.map(b => b.court?.venue?.name).filter(Boolean))];

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.court?.venue?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesVenue = selectedVenue === 'all' || b.court?.venue?.name === selectedVenue;
    
    return matchesSearch && matchesVenue;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => (b.status === 'confirmed' || b.status === 'completed') ? sum + parseFloat(b.total_price) : sum, 0);

  const aggregatedReport = Object.values(filteredBookings.reduce((acc, b) => {
    const date = b.booking_date || b.start_time?.split('T')[0];
    const venueName = b.court?.venue?.name || 'Unknown GOR';
    const key = `${date}_${venueName}`;
    
    if (!acc[key]) {
      acc[key] = { date, venueName, totalBookings: 0, grossRevenue: 0, successBookings: 0, pendingBookings: 0, cancelledBookings: 0, courts: {} };
    }
    
    const courtName = b.court?.name || 'Unknown Court';
    if (!acc[key].courts[courtName]) acc[key].courts[courtName] = { volume: 0, revenue: 0 };
    
    acc[key].totalBookings += 1;
    acc[key].courts[courtName].volume += 1;
    
    if (b.status === 'confirmed' || b.status === 'completed') {
      acc[key].grossRevenue += parseFloat(b.total_price);
      acc[key].courts[courtName].revenue += parseFloat(b.total_price);
      acc[key].successBookings += 1;
    } else if (b.status === 'pending') {
      acc[key].pendingBookings += 1;
    } else {
      acc[key].cancelledBookings += 1;
    }
    
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin"></div>
          <CalendarDays className="absolute inset-0 m-auto w-8 h-8 text-[#D4AF37] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 px-2 sm:px-0">
      
      {/* Cinematic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#111] border border-white/5 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
              {user?.role === 'super_admin' ? 'Laporan Transaksi' : 'Riwayat Booking'}
            </h1>
            <p className="text-neutral-400 mt-3 text-sm sm:text-base max-w-lg">
              {user?.role === 'super_admin' ? 'Pusat agregasi finansial dan aktivitas penyewaan seluruh GOR.' : 'Pantau riwayat pemesanan pelanggan, kelola status, dan ekspor laporan rutin.'}
            </p>
          </div>
          
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowDownloadModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-black/60 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-md hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] group"
              >
                <Download className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <span>Unduh XLSX</span>
              </button>
              <button 
                onClick={() => setShowRecurringModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-400 text-white rounded-2xl font-black transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 text-sm overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Repeat className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Jadwal Rutin</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
      >
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest mb-1">Total Volume Transaksi</p>
          <h3 className="text-3xl font-black text-white">{filteredBookings.length} <span className="text-lg text-neutral-500 font-medium tracking-normal">Sesi Main</span></h3>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest mb-1">Estimasi Omzet Kotor</p>
          <h3 className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{formatIDR(totalRevenue)}</h3>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest mb-1">Transaksi Pending</p>
          <h3 className="text-3xl font-black text-white">{filteredBookings.filter(b => b.status === 'pending').length} <span className="text-lg text-neutral-500 font-medium tracking-normal">Antrean</span></h3>
        </div>
      </motion.div>

      {/* Advanced Filter / Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-2 flex flex-col sm:flex-row gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sticky top-20 z-40 backdrop-blur-xl"
      >
        {user?.role === 'super_admin' && (
          <div className="relative w-full sm:w-64 shrink-0">
            <select 
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full bg-white/[0.02] border border-transparent hover:bg-white/[0.04] focus:border-blue-500/50 text-white text-sm rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer font-bold transition-all"
            >
              <option value="all" className="bg-black">🌎 Semua Mitra GOR</option>
              {uniqueVenues.map((venue, idx) => (
                <option key={idx} value={venue} className="bg-black">{venue}</option>
              ))}
            </select>
            <MapPin className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        )}
        
        <div className="relative w-full flex-1">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" />
          <input 
            type="text" 
            placeholder="Pindai ID Transaksi, Nama Pelanggan, GOR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-transparent focus:border-blue-500/50 rounded-2xl py-4 pl-14 pr-4 text-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-neutral-600"
          />
        </div>
      </motion.div>

      {/* Grid Based Data Render (Mobile First) */}
      <div className={`grid gap-5 ${user?.role === 'super_admin' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
        <AnimatePresence mode="popLayout">
          {user?.role === 'super_admin' ? (
            // SUPER ADMIN VIEW: AGGREGATED REPORT CARDS
            aggregatedReport.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[3rem]">
                <Receipt className="w-16 h-16 text-neutral-600 mb-4" />
                <p className="text-white font-black text-2xl mb-1">Laporan Nihil</p>
                <p className="text-neutral-500">Tidak ada agregat transaksi yang ditemukan.</p>
              </motion.div>
            ) : (
              aggregatedReport.map((rep, idx) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} key={idx}
                  className="bg-[#0a0a0a] border border-white/5 hover:border-blue-500/30 rounded-[2rem] p-5 sm:p-6 group hover:shadow-[0_10px_40px_rgba(59,130,246,0.1)] transition-all flex flex-col xl:flex-row xl:items-center gap-6"
                >
                  {/* Bagian Kiri: Tanggal & GOR */}
                  <div className="w-full xl:w-[35%] flex flex-col gap-3 border-b xl:border-b-0 xl:border-r border-white/5 pb-5 xl:pb-0 xl:pr-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">Tanggal Rekapitulasi</p>
                        <h4 className="font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block text-sm">
                          {new Date(rep.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h4>
                      </div>
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white line-clamp-1 mt-2">{rep.venueName}</h3>
                  </div>
                  
                  {/* Bagian Tengah: Volume & Omzet */}
                  <div className="w-full xl:flex-1 flex flex-col gap-4 justify-center">
                    <div className="flex flex-row gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">Volume</p>
                        <p className="text-lg sm:text-xl font-black text-blue-400">{rep.totalBookings} Sesi</p>
                      </div>
                      <div className="w-px h-10 bg-white/10"></div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">Omzet Kotor</p>
                        <p className="text-lg sm:text-xl font-black text-emerald-400">{formatIDR(rep.grossRevenue)}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {rep.successBookings > 0 && <span className="flex-1 text-center text-[11px] font-black text-emerald-400 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">{rep.successBookings} Sukses</span>}
                      {rep.pendingBookings > 0 && <span className="flex-1 text-center text-[11px] font-black text-orange-400 bg-orange-500/10 py-2 rounded-xl border border-orange-500/20">{rep.pendingBookings} Tunda</span>}
                      {rep.cancelledBookings > 0 && <span className="flex-1 text-center text-[11px] font-black text-red-400 bg-red-500/10 py-2 rounded-xl border border-red-500/20">{rep.cancelledBookings} Batal</span>}
                    </div>
                  </div>

                  {/* Bagian Kanan: Aksi */}
                  <div className="w-full xl:w-[20%] flex flex-row xl:flex-col gap-3 pt-5 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/5 xl:pl-6">
                    <button onClick={() => setViewReportModal(rep)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 xl:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                      <Eye className="w-4 h-4" /> Rincian
                    </button>
                    <button onClick={() => handleDirectDownload(rep.venueName)} className="flex-1 xl:flex-none xl:w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold py-3 xl:py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-blue-500/20">
                      <Download className="w-4 h-4" /> <span className="hidden sm:inline xl:hidden 2xl:inline">Unduh Laporan</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )
          ) : (
            // ADMIN VIEW: INDIVIDUAL BOOKING CARDS
            filteredBookings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[3rem]">
                <Search className="w-16 h-16 text-neutral-600 mb-4" />
                <p className="text-white font-black text-2xl mb-1">Transaksi Tidak Ditemukan</p>
                <p className="text-neutral-500">Coba ubah kata kunci pencarian Anda.</p>
              </motion.div>
            ) : (
              filteredBookings.map((b, idx) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} key={b.id}
                  className="bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-[2rem] p-5 sm:p-6 group hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all flex flex-col relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 opacity-10 group-hover:scale-125 transition-transform duration-500 ${
                    b.status === 'confirmed' || b.status === 'completed' ? 'bg-emerald-500' :
                    b.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'
                  }`}></div>

                  {/* Card Header: User Info */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {b.user?.profile_image ? (
                          <img src={b.user.profile_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-6 h-6 text-neutral-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-base truncate">{b.user?.name || 'Anonim'}</p>
                        <p className="text-[10px] text-neutral-500 font-mono truncate">{b.user?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-[9px] font-black text-neutral-500 bg-white/5 px-2 py-1 rounded-md uppercase border border-white/5">ID: {b.id.substring(0,6)}</span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-white text-sm">{b.court?.name} <span className="text-neutral-500 font-normal">({b.court?.venue?.name})</span></span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-neutral-300 text-sm">
                        {b.booking_type === 'monthly'
                          ? new Date(b.booking_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                          : new Date(b.booking_date || b.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      {b.booking_type === 'monthly' && b.sessions ? (
                        <div className="flex flex-col gap-1">
                          {b.is_full_access ? (
                            <span className="text-xs font-black text-[#D4AF37] tracking-wider">FULL ACCESS (08:00 - 23:00)</span>
                          ) : (
                            b.sessions.map((s, idx) => (
                              <span key={idx} className="text-xs font-bold text-white">
                                {s.session_name} <span className="text-neutral-500">({s.time_range})</span>
                              </span>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3 font-mono">
                          <span className="text-sm font-black text-white bg-black px-3 py-1.5 rounded-lg border border-white/10">{formatTime(b.start_time)}</span>
                          <span className="text-neutral-600">➔</span>
                          <span className="text-sm font-black text-white bg-black px-3 py-1.5 rounded-lg border border-white/10">{formatTime(b.end_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price & Status Action */}
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">Nilai Transaksi</p>
                      <p className="font-black text-xl text-white tracking-tight">{formatIDR(b.total_price)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(b.status)}
                      <button onClick={() => { setEditingBooking(b); }} className="text-[10px] font-black bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> UBAH STATUS
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Sebelumnya
          </button>
          
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-[#D4AF37] font-black">{page}</span>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-400">{totalPages}</span>
          </div>
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-6 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl font-bold text-sm text-[#D4AF37] hover:bg-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* --- MODALS (Framer Motion Glassmorphism) --- */}
      <AnimatePresence>
        
        {/* Modal Edit Booking */}
        {editingBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingBooking(null)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Modifikasi Status</h2>
                  <p className="text-xs sm:text-sm text-blue-400 mt-1 font-mono uppercase">ID: {editingBooking.id.substring(0,8)}</p>
                </div>
                <button onClick={() => setEditingBooking(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleUpdateBooking} className="p-6 sm:p-8 space-y-6 relative z-10">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-3">Status Terminasi <span className="text-red-500">*</span></label>
                  <select value={editingBooking.status} onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                  >
                    <option value="pending">⏳ Pending (Menunggu Pembayaran)</option>
                    <option value="confirmed">✓ Confirmed (Berhasil/Lunas)</option>
                    <option value="completed">⛳ Completed (Selesai Bermain)</option>
                    <option value="cancelled">✖ Cancelled (Batal)</option>
                  </select>
                </div>
                <button type="submit" disabled={isUpdating} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black px-6 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Status Baru'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Unduh Laporan */}
        {showDownloadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDownloadModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Ekspor Data (.XLSX)</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">Unduh Laporan ke Excel</p>
                </div>
                <button onClick={() => setShowDownloadModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 relative z-10">
                {user?.role === 'super_admin' && (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Pilih Mitra GOR</label>
                    <select 
                      value={downloadFilters.venue}
                      onChange={(e) => setDownloadFilters({...downloadFilters, venue: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all font-bold appearance-none shadow-inner"
                    >
                      <option value="all">Semua GOR Gabungan</option>
                      {uniqueVenues.map((venue, idx) => (
                        <option key={idx} value={venue}>{venue}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Periode Transaksi</label>
                  <select 
                    value={downloadFilters.period}
                    onChange={(e) => setDownloadFilters({...downloadFilters, period: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all font-bold appearance-none shadow-inner"
                  >
                    <option value="all">Sepanjang Waktu (Semua Data)</option>
                    <option value="this_month">Bulan Ini Saja</option>
                    <option value="today">Hari Ini Saja</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-100 font-medium">
                    Ditemukan <strong className="text-white font-black">{getDownloadPreviewCount()}</strong> transaksi siap diunduh berdasarkan filter Anda.
                  </p>
                </div>

                <button 
                  onClick={handleDownloadCSV}
                  disabled={getDownloadPreviewCount() === 0}
                  className="w-full bg-white text-black font-black px-6 py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Download className="w-5 h-5" />
                  Generate Dokumen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Pesanan Rutin */}
        {showRecurringModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowRecurringModal(false)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] pointer-events-none"></div>
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Buat Jadwal Rutin</h2>
                  <p className="text-xs sm:text-sm text-[#D4AF37] mt-1 font-bold">Inject jadwal member ke dalam sistem kalender otomatis</p>
                </div>
                <button onClick={() => setShowRecurringModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="overflow-y-auto p-6 sm:p-8 relative z-10 custom-scrollbar">
                <form onSubmit={handleCreateRecurring} className="space-y-6">
                  
                  {/* Grid 1: User & Lapangan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Email Pelanggan Terdaftar <span className="text-red-500">*</span></label>
                      <input required type="email" value={recurringForm.user_email} onChange={e => setRecurringForm({...recurringForm, user_email: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all shadow-inner placeholder:text-neutral-600" placeholder="member@email.com" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Target Lapangan <span className="text-red-500">*</span></label>
                      <select required value={recurringForm.court_id} onChange={e => setRecurringForm({...recurringForm, court_id: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all appearance-none shadow-inner">
                        <option value="">Pilih Lapangan...</option>
                        {courts.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.venue?.name})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Grid 2: Tanggal & Hari */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Tanggal Mulai <span className="text-red-500">*</span></label>
                      <input required type="date" value={recurringForm.start_date} onChange={e => setRecurringForm({...recurringForm, start_date: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Tanggal Berakhir <span className="text-red-500">*</span></label>
                      <input required type="date" value={recurringForm.end_date} onChange={e => setRecurringForm({...recurringForm, end_date: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Hari Eksekusi <span className="text-red-500">*</span></label>
                      <select required value={recurringForm.day_of_week} onChange={e => setRecurringForm({...recurringForm, day_of_week: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all appearance-none shadow-inner">
                        <option value="0">Senin</option>
                        <option value="1">Selasa</option>
                        <option value="2">Rabu</option>
                        <option value="3">Kamis</option>
                        <option value="4">Jumat</option>
                        <option value="5">Sabtu</option>
                        <option value="6">Minggu</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid 3: Waktu */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Jam Dimulai <span className="text-red-500">*</span></label>
                      <input required type="time" value={recurringForm.start_time} onChange={e => setRecurringForm({...recurringForm, start_time: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Jam Berakhir <span className="text-red-500">*</span></label>
                      <input required type="time" value={recurringForm.end_time} onChange={e => setRecurringForm({...recurringForm, end_time: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#D4AF37] outline-none transition-all shadow-inner" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black font-black px-8 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Repeat className="w-5 h-5" />}
                      Injeksi Jadwal Ke Sistem
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View Report Modal (Super Admin) */}
        {viewReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setViewReportModal(null)}></div>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative z-10"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] pointer-events-none"></div>
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 relative z-10">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Rincian Agregat</h2>
                  <p className="text-xs sm:text-sm text-[#D4AF37] mt-1 font-bold">{viewReportModal.venueName}</p>
                </div>
                <button onClick={() => setViewReportModal(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 relative z-10">
                <div className="bg-black/60 border border-white/10 rounded-2xl p-5 flex justify-between items-center shadow-inner">
                  <div>
                    <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">Periode Cetak</p>
                    <p className="text-white font-bold text-sm">{new Date(viewReportModal.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">Total Omzet</p>
                    <p className="text-[#D4AF37] font-black text-xl">{formatIDR(viewReportModal.grossRevenue)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Kinerja Per Lapangan
                  </h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {Object.entries(viewReportModal.courts).map(([courtName, stats], idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center">{stats.volume}x</div>
                          <p className="text-white font-bold text-sm">{courtName}</p>
                        </div>
                        <p className="text-emerald-400 font-bold text-sm font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg">{formatIDR(stats.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
