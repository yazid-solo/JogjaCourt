import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export default function MitraRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            preview: URL.createObjectURL(file),
            base64: reader.result
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    namaGor: '',
    alamatGor: '',
    noTelpGor: '',
    namaPemilik: '',
    nik: '',
    bank: 'BCA',
    noRek: '',
    jmlLapangan: '2',
    jamBuka: '08:00',
    jamTutup: '23:00',
    harga: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        nama_gor: formData.namaGor,
        alamat_gor: formData.alamatGor,
        no_telp_gor: formData.noTelpGor,
        nama_pemilik: formData.namaPemilik,
        nik: formData.nik,
        bank: formData.bank,
        no_rek: formData.noRek,
        jml_lapangan: parseInt(formData.jmlLapangan),
        harga: parseFloat(formData.harga),
        jam_buka: formData.jamBuka,
        jam_tutup: formData.jamTutup,
        fasilitas: [], // We'll grab this from checkboxes state later if needed, but for now empty array is fine
        foto_gor: uploadedFiles.map(f => f.base64)
      };
      
      // Let's grab the facilities that are checked
      const checkedFacilities = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value)
        .filter(val => val !== "on"); // filter out the agreement checkboxes which default to "on"
      
      if(checkedFacilities.length > 0) payload.fasilitas = checkedFacilities;
      
      await api.post('/kyc-requests', payload);
      
      // Auto login as player
      const loginPayload = new URLSearchParams();
      loginPayload.append('username', formData.email);
      loginPayload.append('password', formData.password);
      
      const loginRes = await api.post('/auth/login', loginPayload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', loginRes.data.access_token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      
      setStep(4);
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal mengirim pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="relative z-10 text-center mb-10 w-full max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-yellow-500/5 border border-[#D4AF37]/30 mb-6 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
           <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Portal <span className="text-[#D4AF37]">Mitra GOR</span></h1>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          Lengkapi data di bawah ini untuk mendaftarkan GOR Anda di JogjaCourt.
        </p>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 z-0 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-400 transition-all duration-500"
                 style={{ width: `${((step - 1) / 2) * 100}%` }}
               />
            </div>
            {[1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300 font-bold ${step >= num ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'bg-[#0a0a0a] border-white/20 text-neutral-500'}`}>
                {step > num ? (
                   <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                ) : (
                   num
                )}
              </div>
            ))}
          </div>
        )}

        {/* Forms */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-2 h-6 bg-[#D4AF37] rounded-full"></div>
               <h3 className="text-xl font-bold">Informasi Dasar & Akun</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email (Untuk Login)</label>
                <input required type="email" name="email" autoComplete="off" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="email@contoh.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Password</label>
                <input required type="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange} minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="Minimal 6 karakter" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nama GOR</label>
              <input required type="text" name="namaGor" value={formData.namaGor} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="Contoh: GOR Badminton Bintang" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Alamat Lengkap</label>
              <textarea required name="alamatGor" value={formData.alamatGor} onChange={handleChange} rows="3" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all resize-none" placeholder="Alamat detail beserta kecamatan dan kode pos" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nomor Telepon / WhatsApp GOR</label>
              <input required type="tel" name="noTelpGor" value={formData.noTelpGor} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="08123456789" />
            </div>

            <button type="submit" className="w-full mt-6 py-4 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-[#D4AF37] hover:to-yellow-500 hover:text-black text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group">
              Selanjutnya
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-2 h-6 bg-[#D4AF37] rounded-full"></div>
               <h3 className="text-xl font-bold">Legalitas & Pencairan Dana</h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nama Lengkap Pemilik (Sesuai KTP)</label>
              <input required type="text" name="namaPemilik" value={formData.namaPemilik} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="Nama asli pengelola/pemilik" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nomor Induk Kependudukan (NIK)</label>
              <input required type="number" name="nik" value={formData.nik} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="16 digit NIK" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="space-y-1.5 sm:col-span-1">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Bank</label>
                 <select name="bank" value={formData.bank} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4AF37] appearance-none">
                   {[
                     'BCA', 'Bank Mandiri', 'BRI', 'BNI', 'BSI (Bank Syariah Indonesia)', 
                     'CIMB Niaga', 'Permata Bank', 'Bank Danamon', 'Bank Mega', 'BTN', 
                     'Panin Bank', 'BTPN / Jenius', 'Bank Jago', 'SeaBank', 'Allo Bank', 
                     'Gopay', 'OVO', 'DANA', 'LinkAja', 'ShopeePay'
                   ].map(bank => (
                     <option key={bank} className="bg-[#1a1a1a] text-white" value={bank}>{bank}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-1.5 sm:col-span-2">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Nomor Rekening</label>
                 <input required type="number" name="noRek" value={formData.noRek} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="No Rekening pencairan pendapatan" />
               </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={handlePrev} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10">
                Kembali
              </button>
              <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-[#D4AF37] hover:to-yellow-500 hover:text-black text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group">
                Selanjutnya
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-2 h-6 bg-[#D4AF37] rounded-full"></div>
               <h3 className="text-xl font-bold">Fasilitas & Operasional</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Jumlah Lapangan</label>
                 <select name="jmlLapangan" value={formData.jmlLapangan} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] appearance-none">
                   {[1,2,3,4,5,6,7,8,9,10].map(n => <option className="bg-[#1a1a1a] text-white" key={n} value={n}>{n} Lapangan</option>)}
                 </select>
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Harga per Jam (Rp)</label>
                 <input required type="number" name="harga" value={formData.harga} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" placeholder="50000" />
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Jam Buka</label>
                 <input required type="time" name="jamBuka" value={formData.jamBuka} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Jam Tutup</label>
                 <input required type="time" name="jamTutup" value={formData.jamTutup} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" />
               </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Fasilitas Ekstra Tersedia</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {['Kantin / Cafe', 'Toilet Bersih', 'Mushola', 'Parkir Luas', 'Wifi Gratis', 'Loker', 'Tribun', 'Sewa Raket'].map((fasilitas) => (
                   <label key={fasilitas} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" value={fasilitas} className="peer appearance-none w-5 h-5 rounded border-2 border-neutral-600 bg-transparent checked:bg-[#D4AF37] checked:border-[#D4AF37] transition-colors cursor-pointer" />
                        <svg className="absolute w-3.5 h-3.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">{fasilitas}</span>
                   </label>
                 ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-3">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex justify-between items-center">
                 Validasi Foto GOR (Min. 3 Foto)
                 <span className="text-[#D4AF37] text-[10px]">*Wajib</span>
              </label>
              <div className="w-full border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white/[0.02] transition-colors group cursor-pointer relative overflow-hidden">
                 <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                 <svg className="w-10 h-10 text-neutral-500 group-hover:text-[#D4AF37] mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <p className="text-sm text-neutral-300 font-medium mb-1">Klik atau seret foto ke sini</p>
                 <p className="text-xs text-neutral-500">Mendukung format JPG, PNG (Maks 5MB/foto)</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                      <img src={file.preview} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeFile(idx)} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={handlePrev} disabled={loading} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 disabled:opacity-50">
                Kembali
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex justify-center items-center gap-2 disabled:opacity-70">
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <>Ajukan Pendaftaran <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="py-8 text-center animate-[modalSlideUp_0.5s_ease-out]">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
               <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3 text-white">Data Berhasil Terkirim!</h2>
            <p className="text-neutral-400 leading-relaxed mb-4 max-w-md mx-auto">
              Tim verifikator keamanan JogjaCourt sedang meninjau dokumen pendaftaran GOR Anda. Proses KYC memakan waktu maksimal 1x24 jam. Kami akan mengirimkan status melalui WhatsApp.
            </p>
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 rounded-xl mb-8 max-w-md mx-auto">
              <p className="text-[#D4AF37] text-sm font-bold">
                Anda telah otomatis masuk ke dalam aplikasi sebagai Pelanggan (Customer) sambil menunggu persetujuan verifikasi.
              </p>
            </div>
            <button onClick={() => window.location.href = '/explore'} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-black rounded-xl flex items-center justify-center gap-2 group mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Mulai Eksplorasi Aplikasi
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
