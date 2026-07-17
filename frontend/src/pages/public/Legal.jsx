import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Headphones, ArrowLeft, Mail, Phone, MessageSquare } from 'lucide-react';

const PrivacyContent = () => (
  <div className="space-y-6 text-neutral-300 leading-relaxed">
    <p>Di JogjaCourt, privasi Anda adalah prioritas utama kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h3>
    <p>Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat membuat akun, memesan lapangan, atau menghubungi layanan pelanggan. Ini termasuk nama, alamat email, nomor telepon, dan data transaksi.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">2. Penggunaan Informasi</h3>
    <p>Informasi yang kami kumpulkan digunakan untuk memproses pesanan Anda, mengirimkan tiket elektronik (e-ticket), memberikan dukungan pelanggan, dan mengirimkan pembaruan penting mengenai layanan kami.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">3. Keamanan Data</h3>
    <p>Kami menggunakan standar keamanan enkripsi industri untuk memastikan bahwa data pribadi dan pembayaran Anda aman dari akses yang tidak sah.</p>
  </div>
);

const TermsContent = () => (
  <div className="space-y-6 text-neutral-300 leading-relaxed">
    <p>Dengan mengakses dan menggunakan aplikasi JogjaCourt, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">1. Pemesanan dan Pembayaran</h3>
    <p>Semua pemesanan lapangan bergantung pada ketersediaan. Pembayaran harus diselesaikan dalam waktu yang ditentukan (biasanya 1 jam) agar pemesanan Anda terkonfirmasi.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">2. Pembatalan dan Pengembalian Dana</h3>
    <p>Pembatalan yang dilakukan kurang dari 24 jam sebelum jadwal bermain tidak akan mendapatkan pengembalian dana (refund). Pembatalan di atas 24 jam dapat di-refund sesuai dengan kebijakan masing-masing GOR Mitra.</p>
    
    <h3 className="text-xl font-bold text-white mt-8 mb-4">3. Tanggung Jawab Pengguna</h3>
    <p>Pengguna diwajibkan untuk menjaga kebersihan dan fasilitas GOR. Segala bentuk kerusakan yang disebabkan oleh kelalaian pengguna akan menjadi tanggung jawab penuh pengguna yang bersangkutan.</p>
  </div>
);

const SupportContent = () => (
  <div className="space-y-8 text-neutral-300 leading-relaxed">
    <p className="text-lg">Tim JogjaCourt siap membantu Anda. Jika Anda mengalami kendala teknis, masalah pemesanan, atau memiliki pertanyaan lainnya, silakan hubungi kami melalui saluran berikut:</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5 text-center">
        <Mail className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
        <h4 className="text-white font-bold mb-2">Email Support</h4>
        <p className="text-sm text-neutral-400">help@jogjacourt.id</p>
        <p className="text-xs text-neutral-500 mt-2">Dibalas dalam 24 jam</p>
      </div>
      
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5 text-center">
        <Phone className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
        <h4 className="text-white font-bold mb-2">Call Center</h4>
        <p className="text-sm text-neutral-400">+62 812 3456 7890</p>
        <p className="text-xs text-neutral-500 mt-2">Senin - Jumat, 09:00 - 17:00</p>
      </div>
      
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5 text-center">
        <MessageSquare className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
        <h4 className="text-white font-bold mb-2">Live Chat</h4>
        <p className="text-sm text-neutral-400">Via Aplikasi (Bantuan)</p>
        <p className="text-xs text-neutral-500 mt-2">Fast Response</p>
      </div>
    </div>
  </div>
);

export default function Legal({ type }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const contentMap = {
    privacy: {
      title: "Kebijakan Privasi",
      icon: <ShieldCheck className="w-10 h-10 text-[#D4AF37]" />,
      component: <PrivacyContent />
    },
    terms: {
      title: "Syarat & Ketentuan",
      icon: <FileText className="w-10 h-10 text-[#D4AF37]" />,
      component: <TermsContent />
    },
    support: {
      title: "Bantuan & Support",
      icon: <Headphones className="w-10 h-10 text-[#D4AF37]" />,
      component: <SupportContent />
    }
  };

  const current = contentMap[type] || contentMap.privacy;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Navbar Minimalis */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#D4AF37]/20 group-hover:border-[#D4AF37]/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white group-hover:text-[#D4AF37] transition-colors" />
            </div>
            <span className="font-bold text-neutral-400 group-hover:text-white transition-colors">Kembali ke Beranda</span>
          </Link>
          
          <Link to="/" className="flex items-center gap-3">
            <img src="/Logo.svg" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-xl hidden sm:block">JogjaCourt</span>
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 container mx-auto px-6 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#111] border border-white/10 mb-6 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            {current.icon}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">{current.title}</h1>
          <p className="text-neutral-400">Terakhir diperbarui: 15 Juli 2026</p>
        </div>

        {/* Content Box */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            {current.component}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-neutral-500 text-sm">
        <p>&copy; 2026 JogjaCourt. Semua hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
