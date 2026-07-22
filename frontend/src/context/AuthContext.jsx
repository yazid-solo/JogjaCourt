import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const initAuth = async (retries = 3) => {
    setLoading(true);
    setAuthError(null);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const res = await api.get('/auth/me', { timeout: 5000 }); // 5s timeout
        setUser(res.data);
        setLoading(false);
        return; // Success, exit retry loop
      } catch (error) {
        console.error(`Percobaan ${i + 1} Gagal mendapatkan data user:`, error);
        
        if (error.response?.status === 401) {
          // Token invalid/expired, don't retry, just logout
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        
        // If it's the last retry, set error state
        if (i === retries - 1) {
          setAuthError(error.message || "Gagal terhubung ke server");
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    // FastAPI menggunakan OAuth2PasswordRequestForm yang membutuhkan body URL-encoded (form-data)
    const formData = new FormData();
    formData.append('username', email); // backend expects 'username' but we send email
    formData.append('password', password);

    const res = await api.post('/auth/login', formData);
    const data = res.data;
    
    // Menyimpan token ke localStorage
    localStorage.setItem('token', data.access_token);
    
    // Mendapatkan data user terbaru
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
  };

  const register = async (username, email, password, role) => {
    let endpoint = '/auth/register';
    let payload = { 
      name: username, 
      email: email, 
      password: password 
    };

    if (role === 'admin') {
      endpoint = '/auth/register/mitra';
      payload.mitra_gor_name = 'GOR Baru'; // Placeholder if needed
      payload.mitra_gor_address = 'Alamat GOR';
    }

    const res = await api.post(endpoint, payload);
    
    // Setelah berhasil register, langsung login
    await login(email, password); // FASTAPI OAuth2PasswordRequestForm expects email in username field
  };

  const loginWithGoogle = async (googleToken, isMitra = false) => {
    const res = await api.post('/auth/google', { 
      token: googleToken, 
      is_mitra: isMitra 
    });
    const data = res.data;
    
    localStorage.setItem('token', data.access_token);
    
    const userRes = await api.get('/auth/me');
    setUser(userRes.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    loginWithGoogle,
    logout,
    loading
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Koneksi Terputus</h1>
        <p className="text-neutral-400 mb-8 max-w-md">
          Sistem gagal memverifikasi sesi login Anda karena server tidak merespons (kemungkinan sedang restart). Silakan coba lagi.
        </p>
        <button 
          onClick={() => initAuth()}
          className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-yellow-500 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          Coba Hubungkan Ulang
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#D4AF37] mt-4 font-bold text-sm animate-pulse">Memuat Sesi...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
