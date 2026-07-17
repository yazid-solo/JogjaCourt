import React, { useState } from 'react';
import { Sunrise, Sun, Moon, Crown, ChevronRight, CalendarRange, Check, Zap, Info } from 'lucide-react';

// Definisi 3 sesi berdasarkan opsi 1
const SESSIONS = [
  {
    id: 'morning',
    name: 'Sesi Pagi',
    icon: Sunrise,
    time: '08:00 - 13:00',
    hours: '5 jam',
    color: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    iconColor: 'text-amber-500',
    priceMultiplier: 0.4, // 40% dari harga full
    benefits: ['Udara segar pagi', 'Lebih sepi', 'Ideal untuk latihan rutin']
  },
  {
    id: 'afternoon',
    name: 'Sesi Siang',
    icon: Sun,
    time: '13:00 - 18:00',
    hours: '5 jam',
    color: 'from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    iconColor: 'text-blue-500',
    priceMultiplier: 0.4, // 40% dari harga full
    benefits: ['Waktu siang produktif', 'Pas untuk sparring', 'Suhu optimal']
  },
  {
    id: 'evening',
    name: 'Sesi Malam',
    icon: Moon,
    time: '18:00 - 23:00',
    hours: '5 jam',
    color: 'from-purple-500/20 to-pink-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    iconColor: 'text-purple-500',
    priceMultiplier: 0.5, // 50% dari harga full (prime time)
    benefits: ['Prime time populer', 'Setelah jam kerja', 'Suasana ramai & seru'],
    isPrime: true
  }
];

export default function MonthlySessionSelector({ 
  selectedCourt, 
  onCheckout, 
  selectedDate, 
  setSelectedDate, 
  formatIDR 
}) {
  const [selectedSessions, setSelectedSessions] = useState([]); // Default: kosong agar user memilih sendiri
  const [selectedDays, setSelectedDays] = useState([]); // Default kosong agar user memilih hari
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  const DAYS = [
    { value: 0, label: 'Senin' },
    { value: 1, label: 'Selasa' },
    { value: 2, label: 'Rabu' },
    { value: 3, label: 'Kamis' },
    { value: 4, label: 'Jumat' },
    { value: 5, label: 'Sabtu' },
    { value: 6, label: 'Minggu' }
  ];

  if (!selectedCourt?.price_monthly) {
    return (
      <div className="text-center py-8 px-4">
        <Crown className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-400 font-bold text-sm mb-1">Sewa Bulanan Tidak Tersedia</p>
        <p className="text-neutral-600 text-xs">Admin GOR belum mengaktifkan paket member untuk lapangan ini. Silakan pilih lapangan lain atau gunakan sewa per jam.</p>
      </div>
    );
  }

  const basePrice = Number(selectedCourt.price_monthly);
  
  const toggleSession = (sessionId) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  const toggleAllSessions = () => {
    if (selectedSessions.length === 3) {
      // Jika semua terpilih, set ke kosong
      setSelectedSessions([]);
    } else {
      // Pilih semua
      setSelectedSessions(['morning', 'afternoon', 'evening']);
    }
  };

  const toggleDay = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue].sort());
    }
  };

  // Calculate total price based on selected sessions
  const calculatePrice = () => {
    return basePrice * selectedSessions.length;
  };

  const totalPrice = calculatePrice();
  const isFullAccess = selectedSessions.length === 3;
  
  // Hitung end date (+30 hari)
  const startDate = new Date(selectedDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 30);
  
  const formatDateStr = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const activePeriodStr = `${formatDateStr(startDate)} s/d ${formatDateStr(endDate)}`;

  const handleCheckout = () => {
    // Prepare session data untuk backend
    const sessionData = selectedSessions.map(sessionId => {
      const session = SESSIONS.find(s => s.id === sessionId);
      return {
        session_id: session.id,
        session_name: session.name,
        time_range: session.time
      };
    });

    onCheckout({
      sessions: sessionData,
      isFullAccess,
      totalPrice,
      days_of_week: selectedDays
    });
  };

  return (
    <>
      {/* Pilih Tanggal Mulai */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Tanggal Mulai Berlangganan</label>
        <div className="relative">
          <CalendarRange className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <p className="text-[10px] text-neutral-400 mt-2">Masa aktif: <span className="font-bold text-[#D4AF37]">{activePeriodStr}</span></p>
      </div>

      {/* Pilih Hari */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Pilih Hari Akses</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <button
              key={day.value}
              onClick={() => toggleDay(day.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDays.includes(day.value)
                  ? 'bg-[#D4AF37] text-black shadow-md scale-105'
                  : 'bg-black/30 text-neutral-400 border border-white/10 hover:border-white/30'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session Selector Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Pilih Sesi Akses</label>
          <button
            onClick={() => setShowSessionInfo(!showSessionInfo)}
            className="text-neutral-600 hover:text-[#D4AF37] transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={toggleAllSessions}
          className="text-xs font-bold text-[#D4AF37] hover:text-yellow-400 transition-colors flex items-center gap-1"
        >
          {isFullAccess ? 'Reset' : 'Pilih Semua'}
          <Zap className="w-3 h-3" />
        </button>
      </div>

      {/* Info Box */}
      {showSessionInfo && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="font-bold mb-1">💡 Cara Kerja Sesi:</p>
          <ul className="space-y-1 ml-3">
            <li>• Pilih 1 sesi untuk akses 5 jam/hari</li>
            <li>• Pilih 2 sesi untuk akses 10 jam/hari</li>
            <li>• Pilih 3 sesi untuk full access 15 jam/hari</li>
          </ul>
        </div>
      )}

      {/* Session Cards */}
      <div className="space-y-3 mb-5">
        {SESSIONS.map((session) => {
          const Icon = session.icon;
          const isSelected = selectedSessions.includes(session.id);
          const sessionPrice = basePrice;
          
          return (
            <button
              key={session.id}
              onClick={() => toggleSession(session.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? `bg-gradient-to-r ${session.color} ${session.borderColor} shadow-lg scale-[1.02]`
                  : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50'
              }`}
            >
              {/* Background Glow */}
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-r ${session.color} opacity-20 blur-xl`} />
              )}
              
              {/* Content */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${isSelected ? `bg-gradient-to-br ${session.color}` : 'bg-white/5'} flex items-center justify-center shrink-0 border ${isSelected ? session.borderColor : 'border-white/10'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? session.iconColor : 'text-neutral-600'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${isSelected ? session.textColor : 'text-neutral-400'}`}>
                        {session.name}
                      </h3>
                      {session.isPrime && (
                        <span className="text-[9px] bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                          Prime
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                      <span className="font-mono font-bold">{session.time}</span>
                      <span className="text-neutral-700">•</span>
                      <span>{session.hours}</span>
                    </div>

                    {/* Benefits - Show on selected */}
                    {isSelected && (
                      <div className="mt-2 space-y-1">
                        {session.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                            <Check className="w-3 h-3 text-emerald-500" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Checkbox */}
                <div className="flex flex-col items-end gap-2">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? `${session.borderColor} bg-gradient-to-br ${session.color}` 
                      : 'border-white/20 bg-black/30'
                  }`}>
                    {isSelected && <Check className={`w-3 h-3 ${session.iconColor}`} />}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-600">Harga sesi/bln</p>
                    <p className={`text-xs font-bold ${isSelected ? session.textColor : 'text-neutral-600'}`}>
                      {formatIDR(sessionPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Full Access Badge */}
      {isFullAccess && (
        <div className="mb-5 p-4 bg-gradient-to-r from-[#D4AF37]/20 to-yellow-600/10 border border-[#D4AF37]/30 rounded-xl animate-in zoom-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#D4AF37] mb-0.5">🎉 Full Access Aktif!</p>
              <p className="text-xs text-neutral-400">Akses penuh 08:00 - 23:00 setiap hari</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-black/50 rounded-xl p-4 mb-5 border border-white/5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Lapangan:</span>
          <span className="font-bold text-white">{selectedCourt.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Periode:</span>
          <span className="font-bold text-white text-right">30 Hari</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Sesi Dipilih:</span>
          <span className="font-bold text-emerald-400">{selectedSessions.length} Sesi ({selectedSessions.length * 5} jam/hari)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Hari Akses:</span>
          <span className="font-bold text-emerald-400 text-right">
            {selectedDays.length === 7 ? 'Setiap Hari' : selectedDays.map(d => DAYS.find(x => x.value === d).label).join(', ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Akses Harian:</span>
          <div className="text-right">
            {selectedSessions.map(sessionId => {
              const session = SESSIONS.find(s => s.id === sessionId);
              return (
                <div key={sessionId} className="text-xs text-emerald-400 font-mono">
                  {session.time}
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-white/10 pt-3 flex justify-between items-center">
          <span className="text-neutral-400 text-sm">Total Pembayaran:</span>
          <div className="text-right">
            <span className="font-bold text-[#D4AF37] text-xl">{formatIDR(totalPrice)}</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-600 text-center">
          * Harga dihitung berdasarkan jumlah sesi yang dipilih
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleCheckout}
        disabled={selectedSessions.length === 0 || selectedDays.length === 0}
        className={`w-full font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 ${
          (selectedSessions.length === 0 || selectedDays.length === 0)
            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/10'
            : 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:to-yellow-400 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        <Crown className="w-5 h-5" />
        {selectedSessions.length === 0 ? 'Pilih Minimal 1 Sesi' : selectedDays.length === 0 ? 'Pilih Minimal 1 Hari' : `Daftar Member (30 Hari)`}
        {(selectedSessions.length > 0 && selectedDays.length > 0) && <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Helper Text */}
      <p className="text-center text-[10px] text-neutral-600 mt-3">
        💡 Anda bisa mengubah pilihan sesi sebelum checkout
      </p>
    </>
  );
}
