import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2, KeyRound, User, Mail, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'admin' ? 'admin' : 'player';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(username, email, password, role);
      // AuthContext will auto login and navigate to Home, or we can force it here
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mendaftar. Username atau email mungkin sudah digunakan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsGoogleLoading(true);
    try {
      // Kirim isMitra jika rolenya admin
      await loginWithGoogle(credentialResponse.credential, role === 'admin');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mendaftar dengan Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Login Google dibatalkan atau gagal.');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599839619722-39751411ea63?w=1920&q=80')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
      
      <div className="w-full max-w-md relative z-10 py-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 cursor-pointer group">
          <img src="/logo.png" alt="JogjaCourt" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-3xl font-black text-white tracking-tighter">JogjaCourt</span>
        </Link>

        {/* Card */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
            <p className="text-neutral-400 text-sm">Bergabunglah dan nikmati kemudahan booking</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="w-full">
            
            {/* Role Selector */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                  role === 'player' 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' 
                    : 'bg-black/50 border-white/10 text-neutral-500 hover:border-white/30 hover:text-white'
                }`}
              >
                Pemain
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'admin' 
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                    : 'bg-black/50 border-white/10 text-neutral-500 hover:border-white/30 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Mitra GOR
              </button>
            </div>

            {role === 'player' ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-neutral-500" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        autoComplete="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                        placeholder="Username unik"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-neutral-500" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        autoComplete="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                        placeholder="email@contoh.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="w-5 h-5 text-neutral-500" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full mt-6 text-black font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-2 group disabled:opacity-70 bg-[#D4AF37] hover:bg-yellow-500"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Daftar Sekarang
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0a0a0a] text-neutral-500 font-medium">atau daftar dengan</span>
                  </div>
                </div>

                {/* Google Login Component */}
                <div className="w-full flex justify-center bg-white rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                  <div className="scale-110 origin-center py-1">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text="signup_with"
                      shape="rectangular"
                      width="350"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pendaftaran Mitra Terpusat</h3>
                <p className="text-sm text-neutral-400 mb-6 leading-relaxed">Untuk menjamin keamanan platform, pendaftaran Mitra GOR kini harus melalui proses verifikasi (KYC) dan legalitas di Portal Mitra JogjaCourt.</p>
                <Link to="/mitra-register" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                   Lanjutkan ke Portal Mitra
                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-neutral-400 text-sm">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#D4AF37] font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
