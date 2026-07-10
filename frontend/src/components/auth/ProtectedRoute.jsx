import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  // Jika tidak ada user (belum login)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika allowedRoles ada, tapi role user tidak cocok
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Arahkan ke halaman utama atau tampilkan 403 Forbidden
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-red-500 text-4xl font-black">403</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Akses Ditolak</h1>
        <p className="text-neutral-400 mb-8">
          Anda tidak memiliki izin (role: {user.role}) untuk mengakses halaman ini.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Jika lolos semua verifikasi, tampilkan rute anak (Outlet)
  return <Outlet />;
}
