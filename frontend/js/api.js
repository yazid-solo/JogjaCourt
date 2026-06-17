// ==========================================
// JogjaCourt API Client
// Backend: http://127.0.0.1:8000
// ==========================================

const API_BASE_URL = 'http://127.0.0.1:8000';

// GLOBAL ERROR CATCHER FOR DEBUGGING
window.addEventListener('error', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:9999;padding:10px;font-size:12px;word-break:break-all;";
    errDiv.innerText = `JS CRASH: ${e.message} di ${e.filename}:${e.lineno}`;
    document.body.prepend(errDiv);
});
window.addEventListener('unhandledrejection', function(e) {
    const errDiv = document.createElement('div');
    errDiv.style = "position:fixed;top:40px;left:0;width:100%;background:darkred;color:white;z-index:9999;padding:10px;font-size:12px;word-break:break-all;";
    errDiv.innerText = `PROMISE HANG: ${e.reason}`;
    document.body.prepend(errDiv);
});

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

        // If FormData, remove Content-Type so browser sets boundary automatically
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        let response;
        try {
            response = await fetch(url, { ...options, headers });
        } catch (networkError) {
            throw new Error('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan (uvicorn app.main:app --reload).');
        }

        // Handle 401 - token expired
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            const isAdminPage = window.location.pathname.includes('/admin/');
            window.location.href = isAdminPage ? '../login.html' : 'login.html';
            throw new Error('Sesi berakhir. Silakan login ulang.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: Terjadi kesalahan pada server`);
        }

        // Handle empty response (e.g., 204 No Content)
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
