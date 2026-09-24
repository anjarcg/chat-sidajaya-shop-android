# Sidajaya AI — Aplikasi Android (Capacitor)

APK = cangkang WebView ke `https://ai.sidajaya.shop`. PHP/MySQL/n8n tetap di server.

## Isi folder ini

| Berkas | Fungsi |
|---|---|
| `package.json` | daftar plugin Capacitor (camera, filesystem, push, local-notif, app, network, preferences) |
| `capacitor.config.json` | appId `com.sidajaya.chatv4`, `server.url` ke ai.sidajaya.shop |
| `www/index.html` | fallback redirect bila WebView belum sinkron |
| `www/android-bridge.js` | bridge web↔native: kamera, izin, notif lokal, daftar token FCM |
| `web-patch/snippet.html` | cuplikan ditempel ke `web/chat.php` sebelum `</body>` |
| `server-example/push_token.php` | contoh endpoint simpan token FCM per user |
| `native/AndroidManifest-permissions.xml` | izin CAMERA, READ_MEDIA_*, POST_NOTIFICATIONS |

## Syarat build di mesin ini (belum terpenuhi — [TERVERIFIKASI])

- `node v24.19.0 + npm 11.17.0` ✅ ada
- `java` ❌ tidak ada → pasang JDK 17
- Android SDK ❌ tidak ada → pasang via Android Studio

## Langkah build

1. `npm install` (di root repo ini)
2. `npx cap init "Sidajaya AI" com.sidajaya.chatv4 --web-dir=www` (atau pakai `capacitor.config.json` yang ada)
3. `npx cap add android` lalu `npx cap sync`
4. Sisipkan izin dari `native/AndroidManifest-permissions.xml` ke `android/app/src/main/AndroidManifest.xml`
5. Firebase (untuk push jarak jauh): buat projek di console.firebase.google.com → unduh `google-services.json` → taruh di `android/app/`, tambah plugin gradle sesuai docs `@capacitor/push-notifications` v6
6. Buka `android/` di Android Studio → Build → APK/AAB → test di HP asli
7. Di server: upload `www/android-bridge.js` jadi `/android-bridge.js`, tempel `web-patch/snippet.html` ke `chat.php` (backup `.audit/` dulu sesuai protokol), pasang `server-example/push_token.php`, buat kirim FCM saat job `done` di `chat_callback.php`

## Catatan perilaku

- Kamera: bila plugin Capacitor aktif, tombol "📸 Buka Kamera" memanggil `Camera.getPhoto()`; kalau tidak, fallback ke `input capture="environment"` bawaan web (sudah ada di `chat.php:606`).
- File/dokumen: tetap lewat `input file` bawaan (`chat.php:604-605`, maks 5 berkas) — FileProvider Capacitor menanganinya otomatis.
- Notif: balasan siap → `LocalNotifications` saat aplikasi terbuka (panggil `SidajayaNative.balasanSiap()` dari `pollJob` saat status `done`); push saat aplikasi tertutup butuh FCM + kirim dari server.
- Login: cookie `PHPSESSID` + `sidajaya_last_session` terbawa WebView karena domain https sama.
