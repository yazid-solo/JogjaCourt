import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Search, CalendarDays, CheckCircle, XCircle, Clock, Repeat, Plus, Receipt, UserCircle, MapPin, Download, Edit3, Save, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('all');
  
  // View Report Modal State (Super Admin)
  const [viewReportModal, setViewReportModal] = useState(null);
  
  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Download Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    venue: 'all',
    period: 'all' // 'all', 'today', 'this_month'
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

  const fetchBookings = async () => {
    try {
      const [resBookings, resCourts] = await Promise.all([
        api.get('/bookings'),
        api.get('/courts')
      ]);
      setBookings(resBookings.data);
      setCourts(resCourts.data);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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

    // Setup Columns
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

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } }; // JogjaCourt Gold
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Add Data Rows
    data.forEach((b, index) => {
      // Fix Invalid Date bug by prioritizing pure string formatting
      const bookingDateStr = b.booking_date ? new Date(b.booking_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(b.start_time).toLocaleDateString('id-ID');
      const timeStr = `${b.start_time.substring(0, 5)} - ${b.end_time.substring(0, 5)}`;
      
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

      // Zebra striping for better readability
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
      }

      // Status colors
      const statusCell = row.getCell('status');
      statusCell.font = { bold: true };
      if (b.status === 'confirmed' || b.status === 'completed') {
          statusCell.font.color = { argb: 'FF00A65A' }; // Success Green
      } else if (b.status === 'pending') {
          statusCell.font.color = { argb: 'FFF39C12' }; // Warning Orange
      } else {
          statusCell.font.color = { argb: 'FFDD4B39' }; // Danger Red
      }
    });

    // Add borders to all cells
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

    // Export Excel File
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
    // Terapkan filter khusus download
    let dataToDownload = bookings;
    if (downloadFilters.venue !== 'all') {
      dataToDownload = dataToDownload.filter(b => b.court?.venue?.name === downloadFilters.venue);
    }
    
    if (downloadFilters.period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      dataToDownload = dataToDownload.filter(b => (b.booking_date || b.start_time).startsWith(today));
    } else if (downloadFilters.period === 'this_month') {
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
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
    return dataToDownload.length;
  };

  const formatIDR = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
      case 'completed':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Berhasil</span>;
      case 'pending':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'cancelled':
      case 'expired':
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full"><XCircle className="w-3.5 h-3.5" /> Batal</span>;
      default:
        return <span className="flex items-center w-max gap-1.5 text-[10px] uppercase font-black tracking-wider text-neutral-400 bg-neutral-500/10 border border-neutral-500/20 px-3 py-1.5 rounded-full">{status}</span>;
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

  // Group bookings by Date and Venue for Super Admin Report
  const aggregatedReport = Object.values(filteredBookings.reduce((acc, b) => {
    const date = b.booking_date;
    const venueName = b.court?.venue?.name || 'Unknown GOR';
    const key = `${date}_${venueName}`;
    
    if (!acc[key]) {
      acc[key] = {
        date,
        venueName,
        totalBookings: 0,
        grossRevenue: 0,
        successBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        courts: {} // Rincian per lapangan
      };
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
    return timeStr.substring(0, 5); // "10:00:00" -> "10:00"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
              <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {user?.role === 'super_admin' ? 'Laporan Transaksi' : 'Riwayat Booking'}
            </h1>
          </div>
          <p className="text-neutral-400 text-sm ml-13">
            {user?.role === 'super_admin' ? 'Pusat pantauan riwayat pemesanan seluruh aplikasi.' : 'Pantau semua riwayat pemesanan lapangan Anda.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {user?.role === 'super_admin' && (
            <div className="relative w-full sm:w-48 group">
              <select 
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] appearance-none cursor-pointer font-medium transition-all"
              >
                <option value="all">Semua Mitra GOR</option>
                {uniqueVenues.map((venue, idx) => (
                  <option key={idx} value={venue}>{venue}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="relative w-full sm:w-64 group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Cari ID, Pelanggan, GOR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium placeholder:text-neutral-600"
            />
          </div>
          
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setShowDownloadModal(true)}
                className="w-full sm:w-auto px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Laporan</span>
              </button>
              <button 
                onClick={() => setShowRecurringModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:to-yellow-400 text-black rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <Repeat className="w-4 h-4" />
                <span className="hidden sm:inline">Pesanan Rutin</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
              <Receipt className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-wider mb-1">Total Transaksi</p>
          <h3 className="text-3xl font-black text-white">{filteredBookings.length} <span className="text-lg text-neutral-500 font-medium">Sesi</span></h3>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-wider mb-1">Volume Penjualan Sukses</p>
          <h3 className="text-3xl font-black text-white">{formatIDR(totalRevenue)}</h3>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-wider mb-1">Menunggu Pembayaran</p>
          <h3 className="text-3xl font-black text-white">{filteredBookings.filter(b => b.status === 'pending').length} <span className="text-lg text-neutral-500 font-medium">Sesi</span></h3>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-separate border-spacing-y-2 p-4">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                {user?.role === 'super_admin' ? (
                  <>
                    <th className="px-6 py-4 border-b border-white/5">Tanggal Rekap</th>
                    <th className="px-6 py-4 border-b border-white/5">Nama Mitra GOR</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center">Volume (Sesi)</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">Omzet Kotor Harian</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center">Rasio Keberhasilan</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center">Aksi Laporan</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 border-b border-white/5">Pelanggan</th>
                    <th className="px-6 py-4 border-b border-white/5">Detail Lapangan</th>
                    <th className="px-6 py-4 border-b border-white/5">Waktu Main</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">Nilai Transaksi</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {user?.role === 'super_admin' ? (
                // SUPER ADMIN VIEW: AGGREGATED REPORT
                aggregatedReport.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="w-16 h-16 text-neutral-800 mb-4" />
                        <p className="text-white font-bold text-lg mb-1">Tidak Ada Laporan</p>
                        <p className="text-neutral-500 text-sm">Belum ada aktivitas transaksi pada periode atau GOR yang dipilih.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  aggregatedReport.map((rep, idx) => (
                    <tr key={idx} className="bg-black/30 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 rounded-l-2xl align-middle">
                        <span className="inline-block whitespace-nowrap font-bold text-white text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          {new Date(rep.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className="font-bold text-white text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#D4AF37]" />
                          {rep.venueName}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex flex-col items-center bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-xl">
                          <span className="text-sm font-black text-blue-400">{rep.totalBookings}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <p className="font-bold text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-lg inline-block border border-emerald-500/20">
                          {formatIDR(rep.grossRevenue)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                         <div className="flex flex-wrap items-center justify-center gap-2">
                           {rep.successBookings > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{rep.successBookings} Sukses</span>}
                           {rep.pendingBookings > 0 && <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">{rep.pendingBookings} Tunda</span>}
                           {rep.cancelledBookings > 0 && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{rep.cancelledBookings} Batal</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl align-middle text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button 
                            onClick={() => setViewReportModal(rep)}
                            className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center transition-all group-hover:scale-110" 
                            title={`Lihat Rincian Laporan ${rep.venueName}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDirectDownload(rep.venueName)}
                            className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition-all group-hover:scale-110" 
                            title={`Unduh Laporan Khusus ${rep.venueName}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // ADMIN VIEW: INDIVIDUAL BOOKINGS
                filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="w-16 h-16 text-neutral-800 mb-4" />
                        <p className="text-white font-bold text-lg mb-1">Tidak Ada Data</p>
                        <p className="text-neutral-500 text-sm">Belum ada riwayat transaksi yang ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="bg-black/30 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 rounded-l-2xl align-top">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-neutral-500" />
                            {b.user?.name || 'Unknown User'}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 font-mono">{b.user?.email}</span>
                          <span className="text-[9px] text-[#D4AF37] mt-1 font-mono uppercase bg-[#D4AF37]/10 w-max px-2 py-0.5 rounded-full border border-[#D4AF37]/20">ID: {b.id.substring(0,8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{b.court?.name}</span>
                          <span className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-neutral-500" />
                            {b.court?.venue?.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-1 font-medium bg-white/5 w-max px-2 py-0.5 rounded-md uppercase tracking-wider">{b.booking_type === 'monthly' ? 'Member (Bulan)' : 'Reguler (Jam)'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col bg-white/5 p-2.5 rounded-xl border border-white/5 w-max">
                          <span className="text-xs font-bold text-white mb-1 border-b border-white/10 pb-1">
                            {new Date(b.booking_date || b.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          <span className="text-sm font-black text-[#D4AF37]">
                            {formatTime(b.start_time)} 
                            <span className="text-neutral-500 mx-2 text-xs">s/d</span> 
                            {formatTime(b.end_time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <p className="font-bold text-white text-[15px] bg-[#111] p-2 rounded-xl inline-block border border-white/5">
                          {formatIDR(b.total_price)}
                        </p>
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl align-top text-center">
                        {getStatusBadge(b.status)}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pesanan Rutin */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Repeat className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Buat Pesanan Rutin (Member)</h2>
                  <p className="text-xs text-neutral-400 mt-1 font-medium">Jadwalkan main setiap minggu secara otomatis.</p>
                </div>
              </div>
              <button onClick={() => setShowRecurringModal(false)} className="w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center text-neutral-400 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 md:p-8">
              <form onSubmit={handleCreateRecurring} className="space-y-6">
                
                {/* User & Court Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Email Pelanggan <span className="text-red-500">*</span></label>
                    <input required type="email" value={recurringForm.user_email} onChange={e => setRecurringForm({...recurringForm, user_email: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder:text-neutral-700 font-medium" placeholder="member@email.com" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Pilih Lapangan <span className="text-red-500">*</span></label>
                    <select required value={recurringForm.court_id} onChange={e => setRecurringForm({...recurringForm, court_id: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all font-medium appearance-none">
                      <option value="">-- Pilih Lapangan --</option>
                      {courts.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.venue?.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Day Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Mulai Tanggal <span className="text-red-500">*</span></label>
                    <input required type="date" value={recurringForm.start_date} onChange={e => setRecurringForm({...recurringForm, start_date: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Sampai Tanggal <span className="text-red-500">*</span></label>
                    <input required type="date" value={recurringForm.end_date} onChange={e => setRecurringForm({...recurringForm, end_date: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Hari Rutin <span className="text-red-500">*</span></label>
                    <select required value={recurringForm.day_of_week} onChange={e => setRecurringForm({...recurringForm, day_of_week: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium appearance-none">
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

                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Jam Main <span className="text-red-500">*</span></label>
                    <input required type="time" value={recurringForm.start_time} onChange={e => setRecurringForm({...recurringForm, start_time: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Jam Selesai <span className="text-red-500">*</span></label>
                    <input required type="time" value={recurringForm.end_time} onChange={e => setRecurringForm({...recurringForm, end_time: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium" />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:to-yellow-400 text-black font-black px-8 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-all">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Generate Jadwal Otomatis
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Unduh Laporan */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Ekspor Laporan (Excel)</h2>
                  <p className="text-xs text-neutral-400 mt-1 font-medium">Filter data sebelum diunduh (.XLSX)</p>
                </div>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-neutral-400 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              {user?.role === 'super_admin' && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Pilih Mitra GOR</label>
                  <select 
                    value={downloadFilters.venue}
                    onChange={(e) => setDownloadFilters({...downloadFilters, venue: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium appearance-none"
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
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium appearance-none"
                >
                  <option value="all">Sepanjang Waktu (Semua Data)</option>
                  <option value="this_month">Bulan Ini Saja</option>
                  <option value="today">Hari Ini Saja</option>
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <Receipt className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-100 font-medium leading-relaxed">
                    Ditemukan <strong className="text-white font-black text-lg mx-1">{getDownloadPreviewCount()}</strong> transaksi yang cocok dengan filter Anda.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleDownloadCSV}
                disabled={getDownloadPreviewCount() === 0}
                className="w-full bg-white text-black font-black px-6 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-neutral-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Download className="w-5 h-5" />
                Mulai Mengunduh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Booking */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <Edit3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Edit Pesanan</h2>
                  <p className="text-xs text-neutral-400 mt-1 font-medium font-mono">ID: {editingBooking.id.substring(0,8)}</p>
                </div>
              </div>
              <button onClick={() => setEditingBooking(null)} className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-neutral-400 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleUpdateBooking} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Status Pesanan</label>
                  <select 
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({...editingBooking, status: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium appearance-none"
                  >
                    <option value="pending">Pending (Menunggu Pembayaran)</option>
                    <option value="confirmed">Confirmed (Berhasil/Lunas)</option>
                    <option value="completed">Completed (Selesai Bermain)</option>
                    <option value="cancelled">Cancelled (Batal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Total Harga / Omzet (Rp)</label>
                  <input 
                    type="number" 
                    value={editingBooking.total_price}
                    onChange={(e) => setEditingBooking({...editingBooking, total_price: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-[#D4AF37] outline-none transition-all font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black px-6 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 hover:to-blue-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Report Breakdown (Super Admin) */}
      {viewReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                  <Receipt className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Rincian Laporan</h2>
                  <p className="text-xs text-neutral-400 mt-1 font-medium">{viewReportModal.venueName}</p>
                </div>
              </div>
              <button onClick={() => setViewReportModal(null)} className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-neutral-400 transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Tanggal Laporan</p>
                  <p className="text-white font-bold text-sm">
                    {new Date(viewReportModal.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Omzet</p>
                  <p className="text-[#D4AF37] font-black text-lg">{formatIDR(viewReportModal.grossRevenue)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Kinerja Per Lapangan
                </h3>
                <div className="space-y-3">
                  {Object.entries(viewReportModal.courts).map(([courtName, stats], idx) => (
                    <div key={idx} className="bg-black/50 border border-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-xs">{stats.volume}x</span>
                        </div>
                        <p className="text-white font-bold text-sm">{courtName}</p>
                      </div>
                      <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-md">
                        {formatIDR(stats.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setViewReportModal(null)}
                className="w-full bg-white text-black font-black px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all mt-4"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
