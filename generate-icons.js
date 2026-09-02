const sharp = require('sharp');
const path = require('path');

const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#0f172a"/>
  <rect x="40" y="40" width="432" height="432" rx="60" fill="#1e293b"/>
  <text x="256" y="200" text-anchor="middle" font-size="100" font-weight="bold" fill="#eab308" font-family="Arial">ร.153</text>
  <text x="256" y="310" text-anchor="middle" font-size="60" font-weight="bold" fill="#ffffff" font-family="Arial">พัน.3</text>
  <text x="256" y="390" text-anchor="middle" font-size="40" fill="#94a3b8" font-family="Arial">Vehicle Maintenance</text>
</svg>`;

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join('public', 'icons', 'icon-' + size + '.png'));
    console.log('Generated icon-' + size + '.png');
  }
}
generate().catch(console.error);
