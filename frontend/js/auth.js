const auth = {
    login: async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Determine correct path to login.html
        const isAdminPage = window.location.pathname.includes('/admin/');
        window.location.href = isAdminPage ? '../login.html' : 'login.html';
    },

    getUser: () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;
            return JSON.parse(userStr);
        } catch (e) {
            return null; // Handle invalid JSON
        }
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token') && !!auth.getUser();
    },

    isSuperAdmin: () => {
        const user = auth.getUser();
        return user && user.role === 'super_admin';
    },

    requireAuth: () => {
        if (!auth.isAuthenticated()) {
            auth.logout();
            throw new Error('Not authenticated'); // Stop execution
        }
    },

    requireRole: (allowedRoles) => {
        if (!auth.isAuthenticated()) {
            auth.logout();
            throw new Error('Not authenticated');
        }
        const user = auth.getUser();
        if (!user || !allowedRoles.includes(user.role)) {
            alert('Akses Ditolak! Anda tidak memiliki izin untuk halaman ini.');
            const isAdminPage = window.location.pathname.includes('/admin/');
            window.location.href = isAdminPage ? '../index.html' : 'index.html';
            throw new Error('Access denied'); // Stop execution
        }
    }
};

// Auto-update navbar based on auth state
document.addEventListener('DOMContentLoaded', () => {
    const userMenu = document.getElementById('userMenu');
    const loginBtn  = document.getElementById('loginBtn');

    if (userMenu && loginBtn) {
        if (auth.isAuthenticated()) {
            loginBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');

            const user = auth.getUser();
            const nameEl = document.getElementById('userNameDisplay');
            if (nameEl) nameEl.textContent = user.name;

            // Show avatar if exists
            if (user.profile_image) {
                const navAvatarIcons = document.querySelectorAll('.nav-avatar-icon');
                const navAvatarImgs = document.querySelectorAll('.nav-avatar-img');
                
                navAvatarIcons.forEach(icon => icon.classList.add('hidden'));
                navAvatarImgs.forEach(img => {
                    img.src = user.profile_image;
                    img.classList.remove('hidden');
                });
            }

            // Show admin link
            if (user.role === 'admin' || user.role === 'super_admin') {
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.classList.remove('hidden');
                
                const mobileAdminLink = document.getElementById('mobileAdminLink');
                if (mobileAdminLink) mobileAdminLink.classList.remove('hidden');
            }
            
            // Handle Mobile Menu Auth State
            const mobileGuestMenu = document.getElementById('mobileGuestMenu');
            const mobileAuthMenu = document.getElementById('mobileAuthMenu');
            if (mobileGuestMenu && mobileAuthMenu) {
                mobileGuestMenu.classList.add('hidden');
                mobileAuthMenu.classList.remove('hidden');
            }
        } else {
            loginBtn.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    // Logout button (anywhere it appears, including mobile)
    const logoutBtns = document.querySelectorAll('#logoutBtn, .logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    });
});
