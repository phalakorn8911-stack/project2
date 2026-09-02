const sharp = require('sharp');
const path = require('path');

const svgFavicon = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#0f172a"/>
  <text x="16" y="14" text-anchor="middle" font-size="7" font-weight="bold" fill="#eab308" font-family="Arial">ร.153</text>
  <text x="16" y="22" text-anchor="middle" font-size="5" font-weight="bold" fill="#ffffff" font-family="Arial">พัน.3</text>
</svg>`;

async function generate() {
  await sharp(Buffer.from(svgFavicon)).resize(32, 32).png().toFile(path.join('public', 'favicon.png'));
  console.log('Generated favicon.png');
}
generate().catch(console.error);
