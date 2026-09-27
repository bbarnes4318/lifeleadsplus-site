// On Vercel preview builds, add `X-Robots-Tag: noindex` to every response via the Build Output API config.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const env = process.env.VERCEL_ENV;
const file = '.vercel/output/config.json';
if (env && env !== 'production' && existsSync(file)) {
  const config = JSON.parse(readFileSync(file, 'utf8'));
  config.routes = [
    { src: '/(.*)', headers: { 'X-Robots-Tag': 'noindex' }, continue: true },
    ...(config.routes ?? []),
  ];
  writeFileSync(file, JSON.stringify(config, null, 2));
  console.log(`[preview-noindex] X-Robots-Tag: noindex added (VERCEL_ENV=${env})`);
}
