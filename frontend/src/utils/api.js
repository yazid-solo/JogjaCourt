const API_BASE_URL = 'http://127.0.0.1:8000';

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        let response;
        try {
            response = await fetch(url, { ...options, headers });
        } catch (networkError) {
            throw new Error('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.');
        }

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Instead of reloading, maybe we can just redirect using window.location or throw
            if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/profile') || window.location.pathname.startsWith('/my-bookings')) {
                window.location.href = '/login';
            }
            throw new Error('Sesi berakhir. Silakan login ulang.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: Terjadi kesalahan pada server`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return {};
        }

        return response.json();
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    async patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

export { API_BASE_URL };
export default api;
