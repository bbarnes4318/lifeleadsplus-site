import type { APIRoute } from 'astro';

export const prerender = false;

// Read at request time so the redirect follows the deployment's PORTAL_URL.
export const GET: APIRoute = ({ redirect }) => {
  const portal = process.env.PORTAL_URL?.trim().replace(/\/$/, '');
  return redirect(portal ? `${portal}/login` : '/', 302);
};
