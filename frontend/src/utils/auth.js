import api, { API_BASE_URL } from './api';

const auth = {
    login: async (email, password, rememberMe = false) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const url = rememberMe ? `${API_BASE_URL}/auth/login?remember=true` : `${API_BASE_URL}/auth/login`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Email atau password salah');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
    },

    register: async (name, email, password, phone = null) => {
        const body = { name, email, password };
        if (phone) body.phone = phone;
        return await api.post('/auth/register', body);
    },

    registerMitra: async (name, email, password, phone = null, gorName = null, gorAddress = null) => {
        const body = { name, email, password };
        if (phone) body.phone = phone;
        if (gorName) body.mitra_gor_name = gorName;
        if (gorAddress) body.mitra_gor_address = gorAddress;
        return await api.post('/auth/register/mitra', body);
    },

    upgradeMitra: async (gorName, gorAddress) => {
        const body = { 
            mitra_gor_name: gorName,
            mitra_gor_address: gorAddress 
        };
        const res = await api.post('/users/me/mitra-request', body);
        localStorage.setItem('user', JSON.stringify(res));
        return res;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token') && !!auth.getUser();
    },

    isSuperAdmin: () => {
        const user = auth.getUser();
        return user && user.role === 'super_admin';
    }
};

export default auth;
