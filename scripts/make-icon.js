// Konversi assets/logo.jpg -> assets/logo.png (1024x1024, persegi, isi utuh).
// Warna latar bantalan diambil dari median 4 piksel sudut gambar asli.
const path = require('path');
const sharp = require('sharp');

async function main() {
  const src = path.join(__dirname, '..', 'assets', 'logo.jpg');
  const out = path.join(__dirname, '..', 'assets', 'logo.png');
  const img = sharp(src).flatten(); // JPG tidak punya alpha
  const meta = await sharp(src).metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const W = meta.width, H = meta.height;
  const sudut = [px(0, 0), px(W - 1, 0), px(0, H - 1), px(W - 1, H - 1)];
  const med = k => sudut.map(s => s[k]).sort((a, b) => a - b)[1];
  const bg = '#' + [med(0), med(1), med(2)].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  await sharp(src)
    .resize(1024, 1024, { fit: 'contain', background: bg })
    .png()
    .toFile(out);
  console.log(JSON.stringify({ sumber: `${W}x${H}`, hasil: '1024x1024', latar_bantalan: bg }));
}
main().catch(e => { console.error(e.message); process.exit(1); });
