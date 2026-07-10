import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengecek apakah ada token saat aplikasi dimuat (auto login)
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error("Gagal mendapatkan data user:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
