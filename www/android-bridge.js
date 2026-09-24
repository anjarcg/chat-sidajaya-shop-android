/* Sidajaya AI — bridge opsional untuk WebView Capacitor.
 * Cara pakai: tempel <script src="/android-bridge.js"> sebelum </body> di chat.php
 * (lihat android-app/web-patch/snippet.html). Aman di browser biasa: semua
 * panggilan Capacitor dijaga, fallback ke input file bawaan web.
 */
(function () {
  'use strict';
  var Cap = window.Capacitor || null;
  var Plugins = (Cap && Cap.Plugins) || {};
  var App = {
    platform: (Cap && Cap.getPlatform ? Cap.getPlatform() : 'web'),
    isNative: !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform()),
  };

  async function ambilFotoKamera() {
    if (!Plugins.Camera) throw new Error('Plugin Camera belum dipasang.');
    var Camera = Plugins.Camera;
    var hasil = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: 'dataUrl',
      source: 'CAMERA',
    });
    return hasil.dataUrl || null; // "data:image/jpeg;base64,..."
  }

  async function dataUrlKeFile(dataUrl, nama) {
    var res = await fetch(dataUrl);
    var blob = await res.blob();
    return new File([blob], nama || ('foto-' + Date.now() + '.jpg'), { type: blob.type || 'image/jpeg' });
  }

  async function mintaIzinNotifikasi() {
    try {
      if (Plugins.PushNotifications) {
        var st = await Plugins.PushNotifications.requestPermissions();
        if (st && st.receive === 'denied') return false;
        await Plugins.PushNotifications.register();
        return true;
      }
      if (Plugins.LocalNotifications) {
        await Plugins.LocalNotifications.requestPermissions();
        return true;
      }
    } catch (e) { /* abaikan: browser biasa */ }
    return false;
  }

  async function notifLokal(judul, isi) {
    try {
      if (Plugins.LocalNotifications) {
        await Plugins.LocalNotifications.schedule({
          notifications: [{
            title: judul || 'Sidajaya AI',
            body: (isi || '').slice(0, 180),
            id: Date.now() % 2147483647,
          }],
        });
        return true;
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(judul || 'Sidajaya AI', { body: (isi || '').slice(0, 180) });
        return true;
      }
    } catch (e) { /* abaikan */ }
    return false;
  }

  // Daftarkan token FCM ke server (butuh endpoint save_push_token — lihat server/).
  function hubungkanTokenPush(urlSimpan) {
    if (!Plugins.PushNotifications || !urlSimpan) return;
    Plugins.PushNotifications.addListener('registration', function (t) {
      try {
        var fd = new FormData();
        fd.append('action', 'save_push_token');
        fd.append('token', t.value);
        fd.append('platform', App.platform);
        fetch(urlSimpan, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' } }).catch(function () {});
      } catch (e) {}
    });
    Plugins.PushNotifications.addListener('pushNotificationReceived', function (n) {
      notifLokal(n.title, n.body);
    });
  }

  window.SidajayaNative = {
    info: App,
    ambilFotoKamera: ambilFotoKamera,
    dataUrlKeFile: dataUrlKeFile,
    mintaIzinNotifikasi: mintaIzinNotifikasi,
    notifLokal: notifLokal,
    // Panggil saat polling chat_status => done: SidajayaNative.balasanSiap(teksBalasan)
    balasanSiap: function (teks) { return notifLokal('Balasan AI siap', teks); },
    hubungkanTokenPush: hubungkanTokenPush,
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Otomatis minta izin notif sekali di aplikasi native (diabaikan di browser).
    if (App.isNative) { mintaIzinNotifikasi().catch(function () {}); }
  });
})();
