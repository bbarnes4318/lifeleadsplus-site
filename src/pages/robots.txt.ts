import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site';

// VERCEL_ENV is set at build time on Vercel; previews disallow all crawling.
const preview = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production';

export const GET: APIRoute = () =>
  new Response(
    preview
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
