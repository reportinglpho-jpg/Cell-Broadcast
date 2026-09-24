// นำเข้า Firebase SDK สำหรับ Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ใส่ Config ของคุณ (ก๊อปปี้มาจากใน HTML)
firebase.initializeApp({
    apiKey: "AIzaSyBR_9imKY8Fgk2j3Qnm31ERaxKj3cVhRh4",
    authDomain: "my-cell-broadcast.firebaseapp.com",
    projectId: "my-cell-broadcast",
    storageBucket: "my-cell-broadcast.firebasestorage.app",
    messagingSenderId: "603661976960",
    appId: "1:603661976960:web:e318fd41469858e408ad65"
});

const messaging = firebase.messaging();

// ฟังก์ชันนี้จะทำงานเมื่อ "ปิดแอป" หรือ "ล็อคหน้าจอ"
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] ได้รับข้อความเบื้องหลัง', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1157/1157046.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1157/1157046.png',
        vibrate: [1000, 500, 1000, 500, 1000, 500],
        requireInteraction: true, // บังคับให้อยู่บนหน้าจอล็อคจนกว่าจะกด
        tag: 'eas-alert-fcm',
        renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// เมื่อผู้ใช้กดที่การแจ้งเตือน
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) client = clientList[i];
                }
                return client.focus();
            }
            return clients.openWindow('/index.html');
        })
    );
});