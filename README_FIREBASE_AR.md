# تشغيل المزامنة المجانية بين الكمبيوتر والهاتف

النسخة تعمل مباشرة بالحفظ المحلي. لتشغيل المزامنة:

1. أنشئ مشروعًا مجانيًا في Firebase.
2. أنشئ Firestore Database.
3. أضف Web App وانسخ firebaseConfig.
4. افتح ملف firebase-config.js واستبدل `null` بالإعدادات.
5. في Firestore Rules استخدم مؤقتًا أثناء التجربة:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /apps/rental-manager {
      allow read, write: if true;
    }
  }
}
```
6. ارفع الملفات إلى GitHub.

تنبيه: القاعدة السابقة تسمح بالوصول لأي شخص يعرف رابط المشروع. الأفضل لاحقًا إضافة تسجيل دخول وحماية.
