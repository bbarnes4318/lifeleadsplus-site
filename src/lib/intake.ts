// Server-side helpers shared by /api/apply and /api/partial.
import nodemailer from 'nodemailer';

const MAX_BYTES = 16 * 1024;
const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const WEBHOOK_TIMEOUT_MS = 5000;

export const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A per-endpoint limiter: at most LIMIT requests per IP per hour. */
export function rateLimiter() {
  // ponytail: per-instance memory only; serverless instances don't share it. Honeypot + time check are the real guard.
  const hits = new Map<string, number[]>();
  return (ip: string) => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > LIMIT;
  };
}

/**
 * Size limit, rate limit, JSON parse, honeypot and minimum fill time.
 * Returns the remaining fields, or the Response to send back.
 */
export async function readSubmission(
  request: Request,
  clientAddress: () => string,
  limited: (ip: string) => boolean,
): Promise<Record<string, unknown> | Response> {
  const tooLarge = () => json(413, { error: 'Your application is too large.' });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) return tooLarge();
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) return tooLarge();

  let ip = 'unknown';
  try {
    ip = clientAddress();
  } catch {
    // no client address available
  }
  if (limited(ip)) return json(429, { error: 'Too many applications. Please try again later.' });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid request.' });
  }
  if (typeof body !== 'object' || body === null) return json(400, { error: 'Invalid request.' });

  const { company_website, started, ...fields } = body as Record<string, unknown>;
  const elapsed = Date.now() - Number(started);
  if (company_website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json(400, { error: 'We couldn’t accept this application. Please try again.' });
  }
  return fields;
}

export function transport() {
  const env = process.env;
  // Test-only: SMTP_HOST=mock captures messages as JSON instead of sending.
  if (env.SMTP_HOST === 'mock') return nodemailer.createTransport({ jsonTransport: true });
  const port = Number(env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
}

/** Rows as a plain-text body and a simple HTML table. */
export function rowsMail(rows: [string, string][]) {
  return {
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<table cellpadding="6" style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#0F172A">${rows
      .map(
        ([k, v]) =>
          `<tr><th align="left" valign="top" style="border-bottom:1px solid #E1E7EF;color:#3F4D63">${esc(k)}</th><td style="border-bottom:1px solid #E1E7EF;white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join('')}</table>`,
  };
}

/** Sends to APPLY_TO_EMAIL. Resolves true on success; logs and resolves false on failure. */
export async function notify(
  label: string,
  message: { subject: string; text: string; html: string; replyTo?: string },
) {
  try {
    await transport().sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.APPLY_TO_EMAIL,
      ...message,
    });
    return true;
  } catch (err) {
    console.error(`${label}: email failed at ${new Date().toISOString()}:`, (err as Error).message);
    return false;
  }
}

/** POSTs to APPLY_WEBHOOK_URL. Resolves false when unset or on failure (logged). */
export async function webhook(label: string, payload: object) {
  const url = process.env.APPLY_WEBHOOK_URL?.trim();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error(
      `${label}: webhook failed at ${new Date().toISOString()}:`,
      (err as Error).message,
    );
    return false;
  }
}
