import { applySchema, fieldErrors, describe } from '../lib/apply';

const GENERIC = 'Something went wrong sending your application. Please try again.';
const form = document.querySelector<HTMLFormElement>('#apply-form')!;
const status = document.querySelector<HTMLElement>('#form-status')!;
const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
const label = button.querySelector<HTMLElement>('[data-label]')!;
const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
const labels = [...form.querySelectorAll<HTMLElement>('[data-step-label]')];
const progress = form.querySelector<HTMLElement>('[data-progress]')!;
const review = form.querySelector<HTMLElement>('[data-review]')!;
const started = Date.now();
// The error keys each step owns (see fieldErrors).
const STEP_FIELDS = [
  ['agency', 'name', 'email', 'phone'],
  ['states', 'agents', 'verticals'],
  ['program', 'takeCalls', 'callsPerDay', 'hours'],
  ['notes', 'consent'],
];
const LAST = steps.length - 1;
let step = 0;

// States: search filter, select all / clear, removable chips.
const search = form.querySelector<HTMLInputElement>('[data-state-search]')!;
const chips = form.querySelector<HTMLElement>('[data-chips]')!;
const boxes = [...form.querySelectorAll<HTMLInputElement>('input[name=states]')];
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  form.querySelectorAll<HTMLElement>('[data-state-name]').forEach((el) => {
    el.hidden = !el.dataset.stateName!.includes(q);
  });
});
search.addEventListener('keydown', (e) => e.key === 'Enter' && e.preventDefault());
const renderChips = () => {
  chips.replaceChildren(
    ...boxes
      .filter((b) => b.checked)
      .map((b) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = `${b.dataset.label} ×`;
        btn.setAttribute('aria-label', `Remove ${b.dataset.label}`);
        btn.addEventListener('click', () => {
          b.checked = false;
          renderChips();
          search.focus();
        });
        li.append(btn);
        return li;
      }),
  );
};
boxes.forEach((b) => b.addEventListener('change', renderChips));
const setAll = (on: boolean) => {
  boxes.forEach((b) => (b.checked = on));
  renderChips();
};
form.querySelector('[data-states-all]')!.addEventListener('click', () => setAll(true));
form.querySelector('[data-states-clear]')!.addEventListener('click', () => setAll(false));

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
    notes: str('notes'),
    consent: fd.get('consent') === 'on',
  };
};

const controls = (key: string) =>
  form.querySelectorAll<HTMLElement>(
    key === 'hours' ? 'select' : `[name="${key}"]:not([type=checkbox][name=states])`,
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
    ctrls.forEach((c) => c.setAttribute('aria-invalid', 'true'));
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
  label.textContent = on ? 'Sending…' : 'Send application';
};

const el = (tag: string, text?: string, className?: string) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

// Read-only summary of steps 1–3 (same rows as the notification email), each with an Edit link.
const renderReview = () => {
  const parsed = applySchema.safeParse({ ...collect(), notes: '', consent: true });
  if (!parsed.success) return;
  const rows = describe(parsed.data);
  const groups: [number, [string, string][]][] = [
    [0, rows.slice(0, 4)],
    [1, rows.slice(4, 7)],
    [2, rows.slice(7, 11)],
  ];
  review.replaceChildren(
    ...groups.map(([s, items]) => {
      const name = labels[s].querySelector('.steps-text')!.textContent!;
      const edit = el('button', 'Edit', 'mini-btn') as HTMLButtonElement;
      edit.type = 'button';
      edit.append(el('span', ` ${name}`, 'sr-only'));
      edit.addEventListener('click', () => go(s));
      const head = el('div', undefined, 'review-head');
      head.append(el('h3', name), edit);
      const dl = el('dl');
      items.forEach(([k, v]) => dl.append(el('dt', k), el('dd', v)));
      const box = el('div', undefined, 'review-group');
      box.append(head, dl);
      return box;
    }),
  );
};

const go = (next: number, focus = true) => {
  clearErrors();
  step = next;
  steps.forEach((s, i) => (s.hidden = i !== step));
  labels.forEach((l, i) => {
    l.toggleAttribute('data-done', i < step);
    if (i === step) l.setAttribute('aria-current', 'step');
    else l.removeAttribute('aria-current');
  });
  progress.style.width = `${((step + 1) / steps.length) * 100}%`;
  back.hidden = step === 0;
  label.textContent = step === LAST ? 'Send application' : 'Next';
  button.querySelector<SVGElement>('svg')!.style.display = step === LAST ? 'none' : '';
  if (step === LAST) renderReview();
  if (focus) steps[step].querySelector<HTMLElement>('.step-title')!.focus();
};
back.addEventListener('click', () => go(step - 1));
go(0, false);

const pick = (errors: Record<string, string>, keys: string[]) =>
  Object.fromEntries(Object.entries(errors).filter(([k]) => keys.includes(k)));
const stepOf = (errors: Record<string, string>) =>
  STEP_FIELDS.findIndex((keys) => keys.some((k) => k in errors));

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
      body: JSON.stringify({
        ...data,
        company_website: (form.elements.namedItem('company_website') as HTMLInputElement).value,
        started,
      }),
    });
    if (res.ok) {
      form.remove();
      const done = document.querySelector<HTMLElement>('#apply-success')!;
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
