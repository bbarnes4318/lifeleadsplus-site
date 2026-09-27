import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { siteUrl } from '../../lib/site';
import { applySchema, describe, fieldErrors, type Application } from '../../lib/apply';

export const prerender = false;

const MAX_BYTES = 16 * 1024;
const MIN_FILL_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

// ponytail: per-instance memory only; serverless instances don't share it. Honeypot + time check are the real guard.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function transport() {
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

function notification(a: Application) {
  const rows = describe(a);
  return {
    subject: `New client application: ${a.agency}`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: `<table cellpadding="6" style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#0F172A">${rows
      .map(
        ([k, v]) =>
          `<tr><th align="left" valign="top" style="border-bottom:1px solid #E1E7EF;color:#3F4D63">${esc(k)}</th><td style="border-bottom:1px solid #E1E7EF;white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join('')}</table>`,
  };
}

function confirmation(a: Application) {
  const site = siteUrl.startsWith('http://localhost') ? '' : siteUrl;
  const text = `Hi ${a.name},\n\nThanks for applying to Life Leads Plus. We got your application for ${a.agency}.\n\nWe'll reply with your program and rate.\n\nLife Leads Plus`;
  const logo = site
    ? `<img src="${esc(site)}/brand/wordmark.png" width="78" height="50" alt="Life Leads Plus" style="display:block">`
    : '<strong style="color:#0B2350;font-size:20px">Life Leads Plus</strong>';
  return {
    subject: 'We got your application',
    text,
    html: `<div style="font:16px/1.6 Arial,sans-serif;color:#0F172A;max-width:560px">
<div style="padding:16px 0;border-bottom:1px solid #E1E7EF">${logo}</div>
<p>Hi ${esc(a.name)},</p>
<p>Thanks for applying to Life Leads Plus. We got your application for ${esc(a.agency)}.</p>
<p><strong>We'll reply with your program and rate.</strong></p>
<p style="color:#5B6B82">Life Leads Plus</p></div>`,
  };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES) {
    return json(413, { error: 'Your application is too large.' });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return json(413, { error: 'Your application is too large.' });
  }

  let ip = 'unknown';
  try {
    ip = clientAddress;
  } catch {
    // no client address available
  }
  if (limited(ip)) return json(429, { error: 'Too many applications. Please try again later.' });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid request.' });
  }
  if (typeof body !== 'object' || body === null) return json(400, { error: 'Invalid request.' });

  const { company_website, started, ...fields } = body;
  const elapsed = Date.now() - Number(started);
  if (company_website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json(400, { error: 'We couldn’t accept this application. Please try again.' });
  }

  const parsed = applySchema.safeParse(fields);
  if (!parsed.success) return json(422, { errors: fieldErrors(parsed.error) });
  const app = parsed.data;

  const mailer = transport();
  const from = process.env.SMTP_FROM;
  try {
    await mailer.sendMail({
      from,
      to: process.env.APPLY_TO_EMAIL,
      replyTo: app.email,
      ...notification(app),
    });
  } catch (err) {
    console.error(
      `apply: notification failed for "${app.agency}" at ${new Date().toISOString()}:`,
      (err as Error).message,
    );
    return json(502, { error: 'Something went wrong sending your application. Please try again.' });
  }
  console.log(`apply: received "${app.agency}" at ${new Date().toISOString()}`);

  // The application is in; a failed confirmation shouldn't make them resend it.
  try {
    await mailer.sendMail({ from, to: app.email, ...confirmation(app) });
  } catch (err) {
    console.error(`apply: confirmation failed for "${app.agency}":`, (err as Error).message);
  }
  return json(200, { ok: true });
};
