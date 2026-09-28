import { applySchema, baseSchema, fieldErrors } from '../lib/apply';
import { track, trackLead, getAttribution } from '../lib/track';

const GENERIC = 'Something went wrong sending your application. Please try again.';
const form = document.querySelector<HTMLFormElement>('#apply-form')!;
const status = document.querySelector<HTMLElement>('#form-status')!;
const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
const label = button.querySelector<HTMLElement>('[data-label]')!;
const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
const labels = [...form.querySelectorAll<HTMLElement>('[data-step-label]')];
const segs = [...form.querySelectorAll<HTMLElement>('[data-seg]')];
const count = form.querySelector<HTMLElement>('[data-step-count]')!;
const started = Date.now();
// The error keys each step owns (see fieldErrors).
const STEP_FIELDS = [
  ['agency', 'name', 'email', 'phone', 'consent'],
  ['states', 'agents', 'verticals'],
  ['program', 'takeCalls', 'callsPerDay', 'hours', 'notes', 'ageFrom', 'ageTo', 'ages', 'buffer'],
];
const LAST = steps.length - 1;
const SENT_PARTIAL = 'llp_partial_sent';
const APPLIED = 'llp_applied';
let step = 0;

const session = {
  get: (k: string) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string) => {
    try {
      sessionStorage.setItem(k, '1');
    } catch {
      // storage blocked
    }
  },
};

// States: search filter, select all / clear, selected count.
const search = form.querySelector<HTMLInputElement>('[data-state-search]')!;
const stateCount = form.querySelector<HTMLElement>('[data-state-count]')!;
const boxes = [...form.querySelectorAll<HTMLInputElement>('input[name=states]')];
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  form.querySelectorAll<HTMLElement>('[data-state-name]').forEach((el) => {
    el.hidden = !el.dataset.stateName!.includes(q);
  });
});
search.addEventListener('keydown', (e) => e.key === 'Enter' && e.preventDefault());
const renderCount = () => {
  stateCount.textContent = `${boxes.filter((b) => b.checked).length} selected`;
};
boxes.forEach((b) => b.addEventListener('change', renderCount));
const setAll = (on: boolean) => {
  boxes.forEach((b) => (b.checked = on));
  renderCount();
};
form.querySelector('[data-states-all]')!.addEventListener('click', () => setAll(true));
form.querySelector('[data-states-clear]')!.addEventListener('click', () => setAll(false));

// Pay per call extras: shown only while "Pay per call" is picked; cleared when hidden.
const extra = form.querySelector<HTMLElement>('[data-ppc-extra]')!;
const programs = [...form.querySelectorAll<HTMLInputElement>('input[name=program]')];
const syncExtra = () => {
  const on = programs.some((p) => p.checked && p.dataset.slug === 'ppc');
  extra.classList.toggle('open', on);
  extra.inert = !on;
  if (!on) {
    extra.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((c) => {
      c.value = '';
      c.removeAttribute('aria-invalid');
    });
    const err = extra.querySelector<HTMLElement>('#err-ages')!;
    err.hidden = true;
    err.textContent = '';
  }
};
programs.forEach((p) => p.addEventListener('change', syncExtra));

// Pre-select from ?program=ppa|ppc and ?vertical=final-expense|medicare.
const q = new URLSearchParams(location.search);
const preProgram = programs.find((p) => p.dataset.slug && p.dataset.slug === q.get('program'));
if (preProgram) preProgram.checked = true;
form
  .querySelectorAll<HTMLInputElement>('input[name=verticals]')
  .forEach((v) => (v.checked ||= v.dataset.slug === q.get('vertical')));
syncExtra();

const collect = () => {
  const fd = new FormData(form);
  const str = (k: string) => (fd.get(k) as string | null) ?? undefined;
  return {
    agency: str('agency'),
    name: str('name'),
    email: str('email'),
    phone: str('phone'),
    states: fd.getAll('states'),
    agents: str('agents'),
    verticals: fd.getAll('verticals'),
    program: str('program'),
    takeCalls: str('takeCalls'),
    callsPerDay: str('callsPerDay'),
    hoursFrom: str('hoursFrom'),
    hoursTo: str('hoursTo'),
    timezone: str('timezone'),
    ageFrom: str('ageFrom'),
    ageTo: str('ageTo'),
    buffer: str('buffer'),
    notes: str('notes'),
    consent: fd.get('consent') === 'on',
    ...getAttribution(),
  };
};

const controls = (key: string) =>
  form.querySelectorAll<HTMLElement>(
    key === 'hours'
      ? 'select[name^=hours], select[name=timezone]'
      : key === 'ages'
        ? '[name=ageFrom], [name=ageTo]'
        : `[name="${key}"]:not([type=checkbox][name=states])`,
  );

const clearErrors = () => {
  form.querySelectorAll<HTMLElement>('.error').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  status.replaceChildren();
};

const showErrors = (errors: Record<string, string>) => {
  let first: HTMLElement | null = null;
  for (const [key, message] of Object.entries(errors)) {
    const el = form.querySelector<HTMLElement>(`#err-${key}`);
    if (!el) continue;
    el.textContent = message;
    el.hidden = false;
    const ctrls = key === 'states' ? [search] : [...controls(key)];
    ctrls.forEach((c) => {
      c.setAttribute('aria-invalid', 'true');
      c.removeAttribute('data-valid');
    });
    first ??= ctrls[0] ?? null;
  }
  first?.focus();
};

const showStatus = (message: string) => {
  const p = document.createElement('p');
  p.className = 'form-alert';
  p.textContent = message;
  status.replaceChildren(p);
};

const busy = (on: boolean) => {
  button.disabled = on;
  button.querySelector<HTMLElement>('.spinner')!.hidden = !on;
  label.textContent = on ? 'Sending…' : 'Get my rate';
};

// Green check on a text field once it holds a valid value and loses focus.
const shape = baseSchema.shape as Record<string, { safeParse(v: unknown): { success: boolean } }>;
form.addEventListener('focusout', (e) => {
  const input = e.target as HTMLInputElement;
  if (
    !(input instanceof HTMLInputElement) ||
    !['text', 'email', 'tel', 'number'].includes(input.type)
  )
    return;
  const schema = shape[input.name];
  const ok = !!input.value.trim() && !!schema?.safeParse(input.value).success;
  input.toggleAttribute('data-valid', ok);
  if (ok) input.removeAttribute('aria-invalid');
});

form.addEventListener('focusin', () => track('form_start'), { once: true });

const go = (next: number, focus = true) => {
  clearErrors();
  step = next;
  steps.forEach((s, i) => (s.hidden = i !== step));
  labels.forEach((l, i) => {
    l.toggleAttribute('data-done', i < step);
    if (i === step) l.setAttribute('aria-current', 'step');
    else l.removeAttribute('aria-current');
  });
  segs.forEach((s, i) => s.toggleAttribute('data-on', i <= step));
  count.textContent = `Step ${step + 1} of ${steps.length}`;
  back.hidden = step === 0;
  label.textContent = step === LAST ? 'Get my rate' : 'Next';
  if (focus) steps[step].querySelector<HTMLElement>('.step-title')!.focus();
};
back.addEventListener('click', () => go(step - 1));
go(0, false);

const pick = (errors: Record<string, string>, keys: string[]) =>
  Object.fromEntries(Object.entries(errors).filter(([k]) => keys.includes(k)));
const stepOf = (errors: Record<string, string>) =>
  STEP_FIELDS.findIndex((keys) => keys.some((k) => k in errors));

const honeypot = () => (form.elements.namedItem('company_website') as HTMLInputElement).value;

// Step 1's contact details, once per session, so the lead isn't lost if they stop here.
const sendPartial = () => {
  if (session.get(SENT_PARTIAL) || session.get(APPLIED)) return;
  session.set(SENT_PARTIAL);
  const d = collect();
  const attribution = getAttribution();
  fetch('/api/partial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      agency: d.agency,
      name: d.name,
      email: d.email,
      phone: d.phone,
      consent: d.consent,
      ...attribution,
      company_website: honeypot(),
      started,
    }),
  }).catch(() => {});
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  const data = collect();
  const result = applySchema.safeParse(data);
  const errors = result.success ? {} : fieldErrors(result.error);

  // Next: validate only this step's fields.
  if (step < LAST) {
    const mine = pick(errors, STEP_FIELDS[step]);
    if (Object.keys(mine).length) return showErrors(mine);
    track('form_step_complete', { step: step + 1 });
    if (step === 0) sendPartial();
    return go(step + 1);
  }
  if (!result.success) {
    const s = stepOf(errors);
    if (s !== step) go(s, false);
    return showErrors(pick(errors, STEP_FIELDS[s]));
  }

  busy(true);
  try {
    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, company_website: honeypot(), started }),
    });
    if (res.ok) {
      session.set(APPLIED);
      track('form_step_complete', { step: steps.length });
      trackLead();
      const done = document.querySelector<HTMLElement>('#apply-success')!;
      done.querySelector('[data-success-name]')!.textContent = result.data.name;
      done.querySelector('[data-success-email]')!.textContent = result.data.email;
      form.replaceWith(done);
      done.hidden = false;
      done.focus();
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (body.errors) {
      const s = stepOf(body.errors);
      if (s >= 0 && s !== step) go(s, false);
      showErrors(body.errors);
    } else showStatus(res.status === 502 ? GENERIC : (body.error ?? GENERIC));
  } catch {
    showStatus(GENERIC);
  } finally {
    if (document.contains(form)) busy(false);
  }
});
