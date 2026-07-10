import React, { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpRight, Loader2, Landmark, Clock, Calendar, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function Finance() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [payoutLoading, setPayoutLoading] = useState(null);
  
  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/revenue-share?period=${period}`);
      setReport(res.data);
    } catch (error) {
      console.error("Gagal memuat keuangan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
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
      fetchFinance(); // Reload data
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
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  // Calculate user's specific stats if they are an admin, else system total for super admin
  let totalAvailable = 0;
  let totalGross = 0;
  let totalPlatformFee = 0;
  
  if (user?.role === 'super_admin') {
    totalGross = report?.total_gross || 0;
    totalPlatformFee = report?.total_platform_fee || 0;
    totalAvailable = totalPlatformFee; // Super admin's money is the platform fee
  } else {
    // Admin Mitra
    if (report?.items && report.items.length > 0) {
      // Find this admin's detail
      const myDetail = report.items[0]; 
      totalGross = myDetail.gross_revenue;
      totalPlatformFee = myDetail.platform_fee;
      totalAvailable = myDetail.net_income;
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-[#D4AF37]" />
            Bagi Hasil & Keuangan
          </h1>
          <p className="text-neutral-400 mt-2">
            {user?.role === 'super_admin' ? 'Pantau arus kas aplikasi dan pendapatan layanan.' : 'Pantau pendapatan bersih GOR Anda.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-[#111] border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] appearance-none cursor-pointer font-bold"
            >
              <option value="today">Hari Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="all">Sepanjang Waktu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-[2px] rounded-3xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          </div>
        )}
        
        {/* Card 1: Saldo Utama */}
        <div className="bg-gradient-to-br from-[#D4AF37] to-[#B38F2B] rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <Wallet className="absolute right-4 -bottom-4 w-24 h-24 text-black/5 rotate-12 group-hover:rotate-0 transition-transform duration-500 pointer-events-none" />
          
          <p className="font-bold text-black/70 mb-2 uppercase tracking-wider text-xs">
            {user?.role === 'super_admin' ? 'Total Pendapatan Platform' : 'Saldo Net GOR Anda'}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
            {formatIDR(totalAvailable)}
          </h2>
          <div className="flex items-center gap-2 text-sm font-bold bg-black/10 w-max px-3 py-1.5 rounded-lg text-black">
            <CheckCircle2 className="w-4 h-4" />
            <span>Tersedia / Lunas</span>
          </div>
        </div>

        {/* Card 2: Gross Revenue */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ArrowUpRight className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-neutral-400 px-3 py-1 rounded-full">
              Kotor
            </span>
          </div>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-wider mb-2">Total Transaksi (Gross)</p>
          <h3 className="text-3xl font-bold text-white">{formatIDR(totalGross)}</h3>
        </div>
        
        {/* Card 3: Platform Fee */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-red-500/30 transition-all">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Building2 className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-neutral-400 px-3 py-1 rounded-full">
              Biaya
            </span>
          </div>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-wider mb-2">Total Potongan (Fee)</p>
          <h3 className="text-3xl font-bold text-white">{formatIDR(totalPlatformFee)}</h3>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {user?.role === 'super_admin' ? 'Rincian Pendapatan per Mitra GOR' : 'Rincian Transaksi Lapangan Anda'}
          </h3>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-black/20 z-10 backdrop-blur-sm flex items-center justify-center"></div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-separate border-spacing-y-2 p-4">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-4 border-b border-white/5">Mitra GOR & Info Bank</th>
                  <th className="px-6 py-4 border-b border-white/5 text-center">Volume Booking</th>
                  <th className="px-6 py-4 border-b border-white/5 text-right">Pendapatan Kotor</th>
                  <th className="px-6 py-4 border-b border-white/5 text-right text-red-400">Platform Fee</th>
                  <th className="px-6 py-4 border-b border-white/5 text-right text-emerald-400">Net Income</th>
                  {user?.role === 'super_admin' && (
                    <th className="px-6 py-4 border-b border-white/5 text-center text-[#D4AF37]">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'super_admin' ? "6" : "5"} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Wallet className="w-16 h-16 text-neutral-700 mb-4" />
                        <p className="text-white font-bold text-lg mb-1">Belum Ada Transaksi</p>
                        <p className="text-neutral-500 text-sm">Tidak ditemukan riwayat pembayaran sukses pada periode ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  report?.items?.map((detail, idx) => (
                    <tr key={idx} className="bg-black/30 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 rounded-l-2xl">
                        <p className="font-bold text-white text-[15px]">{detail.owner_name}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {detail.venues?.map((v, i) => (
                            <span key={i} className="text-[9px] bg-white/5 text-neutral-400 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">{v}</span>
                          ))}
                        </div>
                        {user?.role === 'super_admin' && (
                          <div className="mt-3 flex items-start gap-2 bg-[#111] p-2.5 rounded-xl border border-white/5">
                            <Landmark className="w-4 h-4 text-[#D4AF37] mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-white">{detail.bank_name || 'Bank Belum Diatur'}</p>
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{detail.bank_account_number || '-'}</p>
                              <p className="text-[10px] text-neutral-500 uppercase mt-0.5">{detail.bank_account_name || 'Tanpa Nama'}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center align-top">
                        <div className="inline-flex flex-col items-center bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-xl">
                          <span className="text-lg font-black text-blue-400">{detail.total_bookings}</span>
                          <span className="text-[9px] font-bold text-blue-500/70 uppercase">Sesi</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <p className="font-bold text-white text-sm">{formatIDR(detail.gross_revenue)}</p>
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <p className="font-bold text-red-400 text-sm bg-red-500/10 px-3 py-1 rounded-lg inline-block border border-red-500/20">
                          - {formatIDR(detail.platform_fee)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl align-top">
                        <p className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg inline-block border border-emerald-500/20">
                          {formatIDR(detail.net_income)}
                        </p>
                      </td>
                      {user?.role === 'super_admin' && (
                        <td className="px-6 py-4 text-center rounded-r-2xl align-middle">
                          <button
                            onClick={() => handlePayout(detail.owner_id, detail.owner_name, detail.net_income)}
                            disabled={payoutLoading === detail.owner_id || detail.net_income <= 0}
                            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all w-full
                              ${detail.net_income > 0 
                                ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                                : 'bg-white/5 text-neutral-500 cursor-not-allowed border border-white/5'}`}
                          >
                            {payoutLoading === detail.owner_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <ArrowDownToLine className="w-4 h-4" /> Transfer
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
