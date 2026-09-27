// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Local dev/build: load .env into process.env (Vercel injects env vars itself).
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

export default defineConfig({
  site:
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:4321'),
  output: 'static',
  adapter: vercel(),
  devToolbar: { enabled: false },
  // Cast: @tailwindcss/vite is typed against a newer Vite than the one Astro 5 bundles.
  vite: { plugins: [/** @type {any} */ (tailwindcss())] },
});
