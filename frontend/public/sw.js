self.addEventListener('push', function(event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Notifikasi Baru", body: event.data.text() };
    }

    const options = {
      body: data.body || 'Anda memiliki pesan baru di JogjaCourt',
      icon: data.icon || '/Logo.svg',
      badge: data.badge || '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/dashboard/chat'
      },
      requireInteraction: true // Notifikasi menetap di layar HP/Desktop sampai ditutup
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'JogjaCourt', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Periksa apakah tab sudah terbuka
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika tidak terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
