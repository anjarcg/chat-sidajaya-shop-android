// Dipanggil GitHub Actions setelah `npx cap add android`: menyisipkan izin
// kamera/file/notif ke AndroidManifest.xml. Aman diulang (idempotent).
const fs = require('fs');
const path = require('path');

const manifest = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const izin = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
];

if (!fs.existsSync(manifest)) {
  console.error('MANIFEST BELUM ADA:', manifest, '(npx cap add android dulu)');
  process.exit(1);
}
let isi = fs.readFileSync(manifest, 'utf8');
let tambah = 0;
for (const baris of izin) {
  if (!isi.includes(baris)) {
    isi = isi.replace('<application', baris + '\n    <application');
    tambah++;
  }
}
fs.writeFileSync(manifest, isi);
console.log('Izin disisipkan: ' + tambah);
