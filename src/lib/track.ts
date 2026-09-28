// Conversion tracking. Fans out to gtag and fbq when Analytics.astro loaded them; no-op otherwise.
type Params = Record<string, string | number | undefined>;
type Fn = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Fn;
    fbq?: Fn;
    /** `${PUBLIC_GOOGLE_ADS_ID}/${PUBLIC_GOOGLE_ADS_LEAD_LABEL}`, set by Analytics.astro when both are. */
    llpAdsLead?: string;
  }
}

export function track(event: string, params: Params = {}) {
  window.gtag?.('event', event, params);
  window.fbq?.('trackCustom', event, params);
}

export function trackLead() {
  track('generate_lead');
  window.fbq?.('track', 'Lead');
  if (window.llpAdsLead) window.gtag?.('event', 'conversion', { send_to: window.llpAdsLead });
}

export const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'referrer',
  'landing',
] as const;
export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

const KEY = 'llp_attribution';

/** First page of the session: remember where the visitor came from. */
export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const q = new URLSearchParams(location.search);
    const a: Attribution = {};
    for (const k of ATTRIBUTION_KEYS.slice(0, 7)) {
      const v = q.get(k);
      if (v) a[k] = v.slice(0, 300);
    }
    if (document.referrer) a.referrer = document.referrer.slice(0, 300);
    a.landing = location.pathname.slice(0, 300);
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // storage blocked
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}
