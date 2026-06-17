/**
 * JogjaCourt — Admin Sidebar Component
 * Renders the sidebar + mobile overlay menu on all admin pages automatically.
 * Usage: include this script AFTER api.js and auth.js, then call:
 *   AdminSidebar.init('page-id');
 *
 * Page IDs:
 *  'dashboard', 'bookings', 'payments', 'court-blocks',
 *  'courts', 'areas', 'venues', 'users'
 */
const AdminSidebar = (() => {

    const NAV_ITEMS = [
        { id: 'dashboard',    href: 'dashboard.html',    icon: 'layout-dashboard', label: 'Dashboard',         group: null },
        { id: null,           label: 'Transaksi',                                                                group: 'label' },
        { id: 'bookings',     href: 'bookings.html',     icon: 'calendar',         label: 'Semua Booking',     group: null },
        { id: 'payments',     href: 'payments.html',     icon: 'credit-card',      label: 'Verifikasi Bayar',  group: null, badge: 'pendingBadge' },
        { id: 'court-blocks', href: 'court-blocks.html', icon: 'shield-off',       label: 'Blokir Lapangan',   group: null },
        { id: null,           label: 'Manajemen',                                                                group: 'label-superadmin' },
        { id: 'courts',       href: 'courts.html',       icon: 'layout-grid',      label: 'Lapangan',          group: null },
        { id: 'areas',        href: 'areas.html',        icon: 'map',              label: 'Daerah',            group: 'superadmin' },
        { id: 'venues',       href: 'venues.html',       icon: 'building-2',       label: 'GOR / Venue',       group: null },
        { id: 'users',        href: 'users.html',        icon: 'users',            label: 'Akun Pengguna',     group: 'superadmin' },
    ];

    function buildNavHTML(activeId, isSA) {
        return NAV_ITEMS.map(item => {
            if (item.group === 'label') {
                return `<p class="sidebar-label">Transaksi</p>`;
            }
            if (item.group === 'label-superadmin') {
                if (!isSA) return `<p class="sidebar-label">Manajemen GOR</p>`;
                return `<p class="sidebar-label">Manajemen</p>`;
            }
            if (item.group === 'superadmin' && !isSA) return '';

            const isActive = item.id === activeId;
            const activeClass = isActive ? 'sidebar-link active' : 'sidebar-link';
            const badgeHTML = item.badge ? `<span id="${item.badge}" class="sidebar-badge hidden">0</span>` : '';
            return `<a href="${item.href}" class="${activeClass}" id="nav-${item.id}">
                <i data-lucide="${item.icon}" class="w-4 h-4 flex-shrink-0"></i>
                <span>${item.label}</span>
                ${badgeHTML}
            </a>`;
        }).join('');
    }

    function buildSidebarHTML(user, isSA, activeId) {
        const roleLabel   = isSA ? '⭐ SUPER ADMIN' : '✦ ADMIN';
        const badgeCls    = isSA ? 'role-badge-superadmin' : 'role-badge-admin';
        const avatarStyle = isSA
            ? 'background:rgba(255,200,0,0.15);color:#FFC800;'
            : 'background:rgba(212,175,55,0.15);color:#D4AF37;';
        const initial     = (user.name || 'A').charAt(0).toUpperCase();

        const avatarHtml = user.profile_image 
            ? `<img src="${user.profile_image}" alt="Profile" class="w-9 h-9 rounded-full object-cover flex-shrink-0">`
            : `<div id="sidebarAvatar" class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style="${avatarStyle}">${initial}</div>`;

        return `
        <div id="sidebarLogo" class="h-16 flex items-center px-6 border-b border-dark-border flex-shrink-0 cursor-pointer" onclick="window.location.href='../index.html'">
            <img src="../logo.png" alt="JogjaCourt Logo" class="h-8 w-auto object-contain transition-transform hover:scale-105" style="filter: drop-shadow(0 0 10px rgba(212,175,55,0.3));">
            <span class="font-display text-xl tracking-wider text-white ml-2 pt-0.5">JOGJA<span class="text-brand">ADMIN</span></span>
        </div>

        <div class="px-5 py-4 border-b border-dark-border flex-shrink-0 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors group" onclick="window.location.href='../profile.html'" title="Buka Profil">
            ${avatarHtml}
            <div class="overflow-hidden">
                <p class="text-sm font-semibold text-white truncate">${user.name || 'Admin'}</p>
                <span class="${badgeCls}">${roleLabel}</span>
            </div>
        </div>

        <nav class="p-4 space-y-0.5 flex-grow overflow-y-auto">
            ${buildNavHTML(activeId, isSA)}
        </nav>

        <div class="p-4 border-t border-dark-border flex-shrink-0">
            <button id="logoutBtn" class="sidebar-link w-full text-red-400 hover:bg-red-900/10 hover:text-red-300">
                <i data-lucide="log-out" class="w-4 h-4 flex-shrink-0"></i>
                <span>Keluar</span>
            </button>
        </div>`;
    }

    function buildMobileTopbarHTML(user, isSA) {
        const initial = (user.name || 'A').charAt(0).toUpperCase();
        const avatarStyle = isSA
            ? 'background:rgba(255,200,0,0.15);color:#FFC800;'
            : 'background:rgba(212,175,55,0.15);color:#D4AF37;';
        
        const avatarHtml = user.profile_image 
            ? `<img src="${user.profile_image}" alt="Profile" class="w-8 h-8 rounded-full object-cover flex-shrink-0">`
            : `<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="${avatarStyle}">${initial}</div>`;

        return `
        <div class="flex items-center gap-3">
            <button id="hamburgerBtn" class="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors" aria-label="Menu">
                <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div class="flex items-center cursor-pointer md:hidden" onclick="window.location.href='../index.html'">
                <img src="../logo.png" alt="JogjaCourt Logo" class="h-7 w-auto object-contain transition-transform hover:scale-105" style="filter: drop-shadow(0 0 10px rgba(212,175,55,0.3));">
                <span class="font-display text-lg tracking-wider text-white ml-2 pt-0.5">JOGJA<span class="text-brand">ADMIN</span></span>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <!-- Notifications -->
            <div class="relative" id="adminNotifWrap">
                <button class="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors relative" onclick="AdminNotifications.toggleDropdown(event)">
                    <i data-lucide="bell" class="w-5 h-5"></i>
                    <span id="adminNotifBadge" class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full hidden"></span>
                </button>
            </div>
            </div>
            <div class="cursor-pointer hover:opacity-80 transition-opacity" onclick="window.location.href='../profile.html'" title="Buka Profil">
                ${avatarHtml}
            </div>
        </div>`;
    }

    function injectStyles() {
        if (document.getElementById('admin-sidebar-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-sidebar-styles';
        style.textContent = `
            /* === SIDEBAR STYLES === */
            .sidebar-link {
                display: flex; align-items: center; gap: 12px;
                padding: 9px 14px; border-radius: 10px;
                font-size: 13.5px; font-weight: 500;
                color: #9ca3af; transition: all 0.18s;
                text-decoration: none; cursor: pointer;
                border: none; background: none; width: 100%;
            }
            .sidebar-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
            .sidebar-link.active { background: rgba(212,175,55,0.1); color: #D4AF37; font-weight: 600; }

            /* Super Admin Gold Override */
            body.superadmin-mode aside { background: linear-gradient(180deg,#100e00 0%,#111 100%); border-right-color: rgba(255,200,0,0.15); }
            body.superadmin-mode .sidebar-link.active { background: rgba(255,200,0,0.12); color: #FFC800; }
            body.superadmin-mode .sidebar-link:hover  { background: rgba(255,200,0,0.07); color: #FFC800; }
            body.superadmin-mode .logo-dot             { background: #FFC800; }
            body.superadmin-mode #sidebarLogo span    { color: #FFC800; }

            .sidebar-label {
                padding: 18px 14px 6px;
                font-size: 10px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.15em;
                color: #4b5563;
            }
            .sidebar-badge {
                margin-left: auto;
                background: rgba(234,179,8,0.2); color: #eab308;
                font-size: 10px; font-weight: 700;
                padding: 1px 7px; border-radius: 99px;
            }
            .role-badge-superadmin {
                display: inline-flex; align-items: center; gap: 4px;
                background: linear-gradient(90deg, rgba(255,200,0,0.15), rgba(255,200,0,0.05));
                border: 1px solid rgba(255,200,0,0.3); color: #FFC800;
                font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
                padding: 2px 8px; border-radius: 99px;
            }
            .role-badge-admin {
                display: inline-flex; align-items: center; gap: 4px;
                background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2);
                color: #D4AF37; font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
                padding: 2px 8px; border-radius: 99px;
            }

            /* === MOBILE OVERLAY SIDEBAR === */
            #mobileSidebarOverlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.7);
                backdrop-filter: blur(4px); z-index: 60;
                opacity: 0; pointer-events: none;
                transition: opacity 0.25s;
            }
            #mobileSidebarOverlay.open { opacity: 1; pointer-events: all; }
            #mobileSidebar {
                position: fixed; top: 0; left: -280px; width: 260px;
                height: 100%; background: #111; border-right: 1px solid #1e1e1e;
                z-index: 61; display: flex; flex-direction: column;
                transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #mobileSidebar.open { left: 0; }

            /* === SCROLLBAR === */
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: #0f0f0f; }
            ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

            /* Topbar */
            #adminTopbar { display: flex; align-items: center; }
        `;
        document.head.appendChild(style);
    }

    function init(activeId) {
        injectStyles();

        // Require auth
        if (typeof auth === 'undefined') return console.error('[AdminSidebar] auth.js required');
        auth.requireRole(['admin', 'super_admin']);

        const user = auth.getUser() || {};
        const isSA = auth.isSuperAdmin();

        if (isSA) document.body.classList.add('superadmin-mode');

        // ---- Desktop Sidebar ----
        const aside = document.querySelector('aside');
        if (aside) {
            aside.innerHTML = buildSidebarHTML(user, isSA, activeId);
        }

        // ---- Mobile Overlay Sidebar ----
        const overlay = document.createElement('div');
        overlay.id = 'mobileSidebarOverlay';
        const mobileSidebar = document.createElement('div');
        mobileSidebar.id = 'mobileSidebar';
        mobileSidebar.innerHTML = buildSidebarHTML(user, isSA, activeId);
        document.body.appendChild(overlay);
        document.body.appendChild(mobileSidebar);

        // ---- Topbar Mobile Controls (prepend, don't overwrite desktop content) ----
        const topbar = document.getElementById('adminTopbar');
        if (topbar) {
            const mobileControls = document.createElement('div');
            mobileControls.className = 'md:hidden flex items-center justify-between h-full w-full';
            mobileControls.innerHTML = buildMobileTopbarHTML(user, isSA);
            topbar.insertBefore(mobileControls, topbar.firstChild);
        }

        // ---- Icons ----
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        // ---- Hamburger Toggle ----
        function openMenu() {
            mobileSidebar.classList.add('open');
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeMenu() {
            mobileSidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        const hamburger = document.getElementById('hamburgerBtn');
        if (hamburger) hamburger.addEventListener('click', openMenu);
        overlay.addEventListener('click', closeMenu);

        // ---- Logout buttons (desktop + mobile) ----
        document.querySelectorAll('#logoutBtn').forEach(btn => {
            btn.addEventListener('click', () => auth.logout());
        });

        // ---- Load pending badge count ----
        loadPendingBadge();
    }

    async function loadPendingBadge() {
        try {
            const payments = await api.get('/payments');
            const pending  = payments.filter(p => p.status === 'pending').length;
            document.querySelectorAll('#pendingBadge').forEach(el => {
                if (pending > 0) {
                    el.textContent = pending;
                    el.classList.remove('hidden');
                }
            });
        } catch (_) { /* silently ignore */ }
    }

    return { init };
})();
