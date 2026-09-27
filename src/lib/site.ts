// Values baked into prerendered pages at build time. On Vercel, changing an env var needs a redeploy.
const env = process.env;
const clean = (v?: string) => v?.trim() || undefined;

export const siteUrl = (clean(env.SITE_URL) ?? 'http://localhost:4321').replace(/\/$/, '');
export const portalUrl = clean(env.PORTAL_URL)?.replace(/\/$/, '');
export const loginHref = portalUrl ? `${portalUrl}/login` : '/login';
export const phone = clean(env.PUBLIC_PHONE);
export const email = clean(env.PUBLIC_EMAIL);
export const legalName = clean(env.COMPANY_LEGAL_NAME) ?? 'Life Leads Plus';
export const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined;

export const nav = [
  { href: '/pay-per-application', label: 'Pay Per Application' },
  { href: '/pay-per-call', label: 'Pay Per Call' },
  { href: '/platform', label: 'The Portal' },
  { href: '/faq', label: 'FAQ' },
];
