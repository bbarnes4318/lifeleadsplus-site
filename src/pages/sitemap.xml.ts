import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site';

const paths = [
  '/',
  '/pay-per-application',
  '/pay-per-call',
  '/platform',
  '/faq',
  '/get-started',
  '/privacy',
  '/terms',
  '/tcpa-compliance',
];

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')}
</urlset>
`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
