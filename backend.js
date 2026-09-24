const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./serviceAccountKey.json');

// 1. เชื่อมต่อระบบหลังบ้าน (แบบใหม่)
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const messaging = getMessaging();

console.log("-----------------------------------------");
console.log("🚀 Backend Server เริ่มทำงานแล้ว...");
console.log("📡 รอรับคำสั่งแจ้งเตือนภัยจากหน้า Admin...");
console.log("-----------------------------------------");

// ดักจับข้อมูล Firestore ทันทีที่มีการกดส่งจากหน้า Admin
let isInitialLoad = true;

db.collection('alerts').orderBy('timestamp', 'desc').limit(1).onSnapshot(async (snapshot) => {
    if (snapshot.empty) return;

    // ข้ามการแจ้งเตือนตอนรันโปรแกรมครั้งแรก
    if (isInitialLoad) {
        isInitialLoad = false;
        return;
    }

    const change = snapshot.docChanges()[0];
    
    // ทำงานเฉพาะตอนที่มีการ "เพิ่ม" ข้อความใหม่เท่านั้น
    if (change && change.type === 'added') {
        const alertData = change.doc.data();
        console.log(`\n🔔 พบคำสั่งใหม่: ${alertData.title}`);

        try {
            // ดึง Token มือถือทั้งหมด
            const tokensSnapshot = await db.collection('fcmTokens').get();
            if (tokensSnapshot.empty) {
                console.log('⚠️ ไม่มีอุปกรณ์ลงทะเบียนรับข้อความ');
                return;
            }

            const tokens = [];
            tokensSnapshot.forEach(doc => tokens.push(doc.id));

            // จัดรูปแบบข้อความปลุกมือถือ (รูปแบบใหม่)
            const message = {
                notification: {
                    title: alertData.title,
                    body: alertData.body,
                },
                data: {
                    severity: alertData.severity || 'Emergency',
                    click_action: 'FLUTTER_NOTIFICATION_CLICK'
                },
                android: {
                    priority: 'high',
                    ttl: 24 * 60 * 60 * 1000 // เก็บข้อความไว้ 24 ชั่วโมงหากปิดเครื่อง
                },
                tokens: tokens // รายชื่ออุปกรณ์ทั้งหมดที่จะส่งไป
            };

            // ยิงแจ้งเตือนทะลุหน้าจอไปยังทุกอุปกรณ์
            const response = await messaging.sendEachForMulticast(message);
            console.log(`✅ ยิงแจ้งเตือนสำเร็จ: ${response.successCount} เครื่อง, ล้มเหลว: ${response.failureCount} เครื่อง`);

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาด:', error);
        }
    }
});