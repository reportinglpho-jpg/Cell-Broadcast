importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. ใส่ Config ของโปรเจกต์ (เหมือนใน index.html)
firebase.initializeApp({
    apiKey: "AIzaSyBR_9imKY8Fgk2j3Qnm31ERaxKj3cVhRh4",
    authDomain: "my-cell-broadcast.firebaseapp.com",
    projectId: "my-cell-broadcast",
    storageBucket: "my-cell-broadcast.firebasestorage.app",
    messagingSenderId: "603661976960",
    appId: "1:603661976960:web:e318fd41469858e408ad65"
});

const messaging = firebase.messaging();

// 2. ดักจับข้อความตอนที่ปิดหน้าเว็บ (Background Message)
messaging.onBackgroundMessage(function(payload) {
  console.log('ได้รับข้อความขณะปิดหน้าเว็บ:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'EMERGENCY ALERT';
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'มีประกาศเตือนภัยฉุกเฉิน',
    icon: 'https://cdn-icons-png.flaticon.com/512/1039/1039949.png', // ไอคอนสัญลักษณ์เตือนภัย
    badge: 'https://cdn-icons-png.flaticon.com/512/1039/1039949.png',
    requireInteraction: true, // บังคับให้ป๊อปอัปค้างบนหน้าจอจนกว่าผู้ใช้จะกดปัดทิ้ง
    vibrate: [500, 250, 500, 250, 500, 250, 1000, 500, 1000], // แพทเทิร์นการสั่นแบบเตือนภัยรุนแรง
    data: {
      url: './' // ลิงก์ที่จะเปิดเมื่อกดที่ป๊อปอัปแจ้งเตือน
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. ตั้งค่าเมื่อผู้ใช้กดที่การแจ้งเตือน (ให้เด้งเปิดหน้าเว็บขึ้นมา)
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // ปิดป๊อปอัปแจ้งเตือน
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // ถ้าเปิดหน้าเว็บค้างไว้อยู่แล้ว ให้สลับหน้าจอไปหา
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.indexOf(self.registration.scope) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // ถ้าปิดเว็บไปแล้ว ให้เปิดหน้าต่างเว็บขึ้นมาใหม่
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});
