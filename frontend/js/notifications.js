/**
 * JogjaCourt — Notification Component
 * Handles fetching, displaying, and interacting with notifications.
 */
const Notifications = (() => {
    let unreadCount = 0;
    let notificationsData = [];

    function injectStyles() {
        if (document.getElementById('notification-styles')) return;
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            #notificationDropdown {
                position: fixed;
                top: 60px;
                right: 16px;
                width: 320px;
                background: #151515;
                border: 1px solid #333;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                z-index: 9999;
                display: none;
                flex-direction: column;
                max-height: 400px;
                overflow-y: auto;
            }
            #notificationDropdown.open {
                display: flex;
            }
            .notif-item {
                padding: 12px 16px;
                border-bottom: 1px solid #222;
                cursor: pointer;
                transition: background 0.2s;
            }
            .notif-item:hover {
                background: rgba(255,255,255,0.05);
            }
            .notif-item.unread {
                background: rgba(212,175,55,0.05);
            }
            .notif-item.unread:hover {
                background: rgba(212,175,55,0.1);
            }
            .notif-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
            .notif-msg { font-size: 11px; color: #9ca3af; line-height: 1.4; }
            .notif-time { font-size: 10px; color: #666; margin-top: 4px; }
            .notif-badge {
                position: absolute;
                top: -2px;
                right: -2px;
                background: #ef4444;
                color: white;
                font-size: 9px;
                font-weight: bold;
                padding: 2px 5px;
                border-radius: 99px;
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    async function loadNotifications() {
        if (!auth.isAuthenticated()) return;
        try {
            notificationsData = await api.get('/notifications');
            unreadCount = notificationsData.filter(n => !n.is_read).length;
            updateBadge();
            renderDropdown();
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }

    function updateBadge() {
        document.querySelectorAll('.notif-badge').forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    function renderDropdown() {
        let dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'notificationDropdown';
            document.body.appendChild(dropdown);
        }

        if (notificationsData.length === 0) {
            dropdown.innerHTML = `<div class="p-6 text-center text-gray-500 text-xs">Belum ada notifikasi</div>`;
            return;
        }

        let html = `<div class="flex justify-between items-center p-3 border-b border-dark-border sticky top-0 bg-[#151515] z-10">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Notifikasi</span>
            <button onclick="Notifications.markAllAsRead()" class="text-[10px] text-brand hover:underline">Tandai semua dibaca</button>
        </div>`;

        notificationsData.forEach(n => {
            const date = new Date(n.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
            const unreadCls = n.is_read ? '' : 'unread';
            html += `
                <div class="notif-item ${unreadCls}" onclick="Notifications.markAsRead('${n.id}')">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-msg">${n.message}</div>
                    <div class="notif-time">${date}</div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
    }

    async function markAsRead(id) {
        try {
            await api.put(`/notifications/${id}/read`);
            const notif = notificationsData.find(n => n.id === id);
            if (notif && !notif.is_read) {
                notif.is_read = true;
                unreadCount = Math.max(0, unreadCount - 1);
                updateBadge();
                renderDropdown();
            }
            // Navigate if related entity
            const inAdmin = window.location.pathname.includes('/admin/');
            const adminPrefix = inAdmin ? '' : 'admin/';
            if (notif && notif.related_entity_type === 'booking') {
                if (auth.getUser().role === 'customer') window.location.href = 'my-bookings.html';
                else window.location.href = adminPrefix + 'bookings.html';
            } else if (notif && notif.related_entity_type === 'payment') {
                if (auth.getUser().role === 'customer') window.location.href = 'my-bookings.html';
                else window.location.href = adminPrefix + 'payments.html';
            }
        } catch (e) { console.error(e); }
    }

    async function markAllAsRead() {
        try {
            await api.put('/notifications/read-all');
            notificationsData.forEach(n => n.is_read = true);
            unreadCount = 0;
            updateBadge();
            renderDropdown();
        } catch (e) { console.error(e); }
    }

    function toggleDropdown(event) {
        if(event) {
            event.stopPropagation();
        }
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('open');
        }
    }

    function init() {
        if (!auth.isAuthenticated()) return;
        injectStyles();
        
        // Setup document click to close dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && dropdown.classList.contains('open')) {
                if (!dropdown.contains(e.target) && !e.target.closest('.notif-toggle-btn')) {
                    dropdown.classList.remove('open');
                }
            }
        });

        // Load notifications immediately
        setTimeout(() => {
            loadNotifications();
        }, 300);
        
        // Optional: Poll every 30 seconds
        setInterval(loadNotifications, 30000);
    }

    return { init, loadNotifications, toggleDropdown, markAsRead, markAllAsRead };
})();
