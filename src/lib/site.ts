// Values baked into prerendered pages at build time. On Vercel, changing an env var needs a redeploy.
const env = process.env;
const clean = (v?: string) => v?.trim() || undefined;

// SITE_URL wins; otherwise Vercel's production domain (custom domain once added, else *.vercel.app).
const vercelUrl = clean(env.VERCEL_PROJECT_PRODUCTION_URL);
export const siteUrl = (
  clean(env.SITE_URL) ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321')
).replace(/\/$/, '');
export const portalUrl = clean(env.PORTAL_URL)?.replace(/\/$/, '');
export const loginHref = portalUrl ? `${portalUrl}/login` : '/login';
export const phone = clean(env.PUBLIC_PHONE);
export const email = clean(env.PUBLIC_EMAIL);
export const legalName = clean(env.COMPANY_LEGAL_NAME) ?? 'Life Leads Plus';
export const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined;
export const scheduleUrl = clean(env.PUBLIC_SCHEDULE_URL);

export const analytics = {
  ga4: clean(env.PUBLIC_GA4_ID),
  metaPixel: clean(env.PUBLIC_META_PIXEL_ID),
  googleAds: clean(env.PUBLIC_GOOGLE_ADS_ID),
  googleAdsLeadLabel: clean(env.PUBLIC_GOOGLE_ADS_LEAD_LABEL),
};
/** Names of the analytics tools that are switched on, for the Privacy page. */
export const analyticsTools = [
  analytics.ga4 && 'Google Analytics',
  analytics.metaPixel && 'Meta Pixel',
  analytics.googleAds && 'Google Ads',
].filter((t): t is string => !!t);

export const nav = [
  { href: '/pay-per-application', label: 'Pay-Per-App (PPA)' },
  { href: '/pay-per-call', label: 'Pay-Per-Call (PPC)' },
  { href: '/platform', label: 'Live Portal' },
  { href: '/faq', label: 'FAQ' },
];
