import { z } from 'zod';

export const STATES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
} as const;
type StateCode = keyof typeof STATES;
const STATE_CODES = Object.keys(STATES) as [StateCode, ...StateCode[]];

export const VERTICALS = ['Final Expense', 'Medicare'] as const;
export const PROGRAMS = ['Pay per application', 'Pay per call', 'Not sure yet'] as const;
export const TAKE_CALLS = ['In the portal', 'On our own phones or dialer', 'Not sure yet'] as const;
export const TIME_ZONES = ['Eastern', 'Central', 'Mountain', 'Pacific'] as const;

/** 06:00–23:00 in 30-minute steps: [value, label]. */
export const TIMES = Array.from({ length: 35 }, (_, i) => {
  const h = 6 + Math.floor(i / 2);
  const m = i % 2 ? '30' : '00';
  const label = `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`;
  return [`${String(h).padStart(2, '0')}:${m}`, label] as const;
});
const TIME_VALUES = TIMES.map(([v]) => v) as [string, ...string[]];

const text = (msg: string, max = 200) =>
  z.string({ error: msg }).trim().min(1, msg).max(max, `Keep this under ${max} characters.`);
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), schema.optional());

export const applySchema = z
  .object({
    agency: text('Enter your agency name.'),
    name: text('Enter your name.'),
    email: z
      .string({ error: 'Enter your email address.' })
      .trim()
      .pipe(z.email('Enter a valid email address.').max(200)),
    phone: z
      .string({ error: 'Enter your mobile phone number.' })
      .trim()
      .max(40)
      .refine((v) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 10, {
        error: 'Enter a valid mobile phone number.',
      }),
    states: z
      .array(z.enum(STATE_CODES), { error: 'Choose at least one state.' })
      .min(1, 'Choose at least one state.'),
    agents: z.coerce
      .number({ error: 'Enter how many licensed agents you have.' })
      .int('Enter a whole number.')
      .min(1, 'Enter a number from 1 to 1000.')
      .max(1000, 'Enter a number from 1 to 1000.'),
    verticals: z
      .array(z.enum(VERTICALS), { error: 'Choose at least one vertical.' })
      .min(1, 'Choose at least one vertical.'),
    program: z.enum(PROGRAMS, { error: 'Choose a program.' }),
    takeCalls: z.enum(TAKE_CALLS, { error: 'Choose how your agents will take calls.' }),
    callsPerDay: optional(
      z.coerce
        .number()
        .int('Enter a whole number.')
        .min(1, 'Enter a number of at least 1.')
        .max(100000, 'Enter a smaller number.'),
    ),
    hoursFrom: optional(z.enum(TIME_VALUES)),
    hoursTo: optional(z.enum(TIME_VALUES)),
    timezone: optional(z.enum(TIME_ZONES)),
    notes: optional(z.string().trim().max(1000, 'Keep this under 1000 characters.')),
    consent: z.literal(true, { error: 'Please agree so we can contact you.' }),
  })
  .superRefine((v, ctx) => {
    const set = [v.hoursFrom, v.hoursTo, v.timezone].filter(Boolean).length;
    if (set > 0 && set < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['hours'],
        message: 'Choose a start time, end time and time zone.',
      });
    } else if (v.hoursFrom && v.hoursTo && v.hoursFrom >= v.hoursTo) {
      ctx.addIssue({
        code: 'custom',
        path: ['hours'],
        message: 'The end time must be after the start time.',
      });
    }
  });

export type Application = z.infer<typeof applySchema>;

/** Field errors keyed by field name (first message only). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    out[key] ??= issue.message;
  }
  return out;
}

/** Human-readable rows for the notification email. */
export function describe(a: Application): [string, string][] {
  return [
    ['Agency name', a.agency],
    ['Your name', a.name],
    ['Email', a.email],
    ['Mobile phone', a.phone],
    ['States', a.states.map((s) => `${STATES[s]} (${s})`).join(', ')],
    ['Number of licensed agents', String(a.agents)],
    ['Verticals', a.verticals.join(', ')],
    ['Program', a.program],
    ['How agents will take calls', a.takeCalls],
    ['Calls wanted per day', a.callsPerDay ? String(a.callsPerDay) : '—'],
    [
      'Delivery hours',
      a.hoursFrom && a.hoursTo
        ? `${TIMES.find(([t]) => t === a.hoursFrom)![1]} – ${TIMES.find(([t]) => t === a.hoursTo)![1]} ${a.timezone}`
        : '—',
    ],
    ['Anything else', a.notes || '—'],
    ['Consent to contact', 'Yes'],
  ];
}
