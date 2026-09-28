import type { APIRoute } from 'astro';
import { attributionRows, partialSchema } from '../../lib/apply';
import { json, notify, rateLimiter, readSubmission, rowsMail, webhook } from '../../lib/intake';

export const prerender = false;

const limited = rateLimiter();

// Step 1 of the application (contact details), sent when a visitor moves on to step 2 so the lead
// isn't lost if they stop there. The form ignores the response.
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const fields = await readSubmission(request, () => clientAddress, limited);
  if (fields instanceof Response) return fields;

  const parsed = partialSchema.safeParse(fields);
  if (!parsed.success) return json(422, { error: 'Invalid request.' });
  const p = parsed.data;

  const rows: [string, string][] = [
    ['Agency name', p.agency],
    ['Your name', p.name],
    ['Email', p.email],
    ['Mobile phone', p.phone],
    ['Consent to contact', 'Yes'],
    ...attributionRows(p),
  ];
  const [hooked, mailed] = await Promise.all([
    webhook('partial', { type: 'partial', ...p, submittedAt: new Date().toISOString() }),
    notify('partial', {
      subject: `Partial application: ${p.agency}`,
      replyTo: p.email,
      ...rowsMail(rows),
    }),
  ]);
  return hooked || mailed ? json(200, { ok: true }) : json(502, { error: 'Not sent.' });
};
