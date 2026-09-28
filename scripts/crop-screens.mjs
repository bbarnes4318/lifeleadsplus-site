// Crops the 1440×900 portal captures down to client-safe regions (no sidebar, header, toasts or
// per-call amounts). Run `node scripts/crop-screens.mjs` after replacing a source capture.
import sharp from 'sharp';

const dir = 'src/assets/screens';
const crops = {
  // Home hero (≥640px): agent tiles and cards, without the owner sidebar, page header or KPI strip.
  'agents-floor': ['agents-floor-1440', 248, 128, 1192, 640],
  'floor-cards': ['agents-floor-1440', 280, 380, 556, 182],
  applications: ['applications-1440', 280, 226, 1128, 470],
  customers: ['crm-agent-1440', 278, 211, 1130, 520],
  statements: ['buyer-billing-1440', 272, 618, 1144, 263],
};

for (const [out, [src, left, top, width, height]] of Object.entries(crops)) {
  await sharp(`${dir}/source/${src}.png`)
    .extract({ left, top, width, height })
    .png()
    .toFile(`${dir}/${out}.png`);
  console.log(`${out}.png ${width}×${height}`);
}
