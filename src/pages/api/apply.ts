import type { APIRoute } from 'astro';
import { siteUrl } from '../../lib/site';
import { applySchema, describe, fieldErrors, type Application } from '../../lib/apply';
import {
  esc,
  json,
  notify,
  rateLimiter,
  readSubmission,
  rowsMail,
  transport,
  webhook,
} from '../../lib/intake';

export const prerender = false;

const limited = rateLimiter();

function confirmation(a: Application) {
  const site = siteUrl.startsWith('http://localhost') ? '' : siteUrl;
  const text = `Hi ${a.name},\n\nThanks for applying to Life Leads Plus. We got your application for ${a.agency}.\n\nWe'll reply with your program, rate and agreement.\n\nLife Leads Plus`;
  const logo = site
    ? `<img src="${esc(site)}/brand/wordmark.png" width="240" height="40" alt="Life Leads Plus" style="display:block">`
    : '<strong style="color:#0B2350;font-size:20px">Life Leads Plus</strong>';
  return {
    subject: 'We got your application',
    text,
    html: `<div style="font:16px/1.6 Arial,sans-serif;color:#0F172A;max-width:560px">
<div style="padding:16px 0;border-bottom:1px solid #E1E7EF">${logo}</div>
<p>Hi ${esc(a.name)},</p>
<p>Thanks for applying to Life Leads Plus. We got your application for ${esc(a.agency)}.</p>
<p><strong>We'll reply with your program, rate and agreement.</strong></p>
<p style="color:#5B6B82">Life Leads Plus</p></div>`,
  };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const fields = await readSubmission(request, () => clientAddress, limited);
  if (fields instanceof Response) return fields;

  const parsed = applySchema.safeParse(fields);
  if (!parsed.success) return json(422, { errors: fieldErrors(parsed.error) });
  const app = parsed.data;

  // Either channel is enough: the lead is kept if the webhook or the email gets through.
  const [hooked, mailed] = await Promise.all([
    webhook('apply', { type: 'application', ...app, submittedAt: new Date().toISOString() }),
    notify('apply', {
      subject: `New client application: ${app.agency}`,
      replyTo: app.email,
      ...rowsMail(describe(app)),
    }),
  ]);
  if (!hooked && !mailed) {
    return json(502, { error: 'Something went wrong sending your application. Please try again.' });
  }
  console.log(`apply: received "${app.agency}" at ${new Date().toISOString()}`);

  // The application is in; a failed confirmation shouldn't make them resend it.
  try {
    await transport().sendMail({
      from: process.env.SMTP_FROM,
      to: app.email,
      ...confirmation(app),
    });
  } catch (err) {
    console.error(`apply: confirmation failed for "${app.agency}":`, (err as Error).message);
  }
  return json(200, { ok: true });
};
