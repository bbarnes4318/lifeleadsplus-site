/** The offer: caller qualification and pricing. Single source for every page that shows them. */
export const qualifications = {
  'final-expense': {
    label: 'Final Expense',
    icon: 'shield-check',
    items: [
      {
        title: 'Confirmed final expense interest',
        body: 'Interest in final expense coverage is confirmed before transfer.',
      },
      {
        title: 'Independent decision maker',
        body: 'Confirms they don’t need a power of attorney to make financial decisions.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'Confirms they don’t live in a nursing home or assisted living facility.',
      },
      {
        title: 'Age 40 to 85',
        body: 'Confirms they’re between 40 and 85.',
      },
      {
        title: 'Active bank account or credit card',
        body: 'Confirms they have an active bank account or credit card.',
      },
      {
        title: 'Ready to talk to a licensed agent',
        body: 'Agrees to speak with a licensed agent about their plan options.',
      },
    ],
  },
  medicare: {
    label: 'Medicare',
    icon: 'stethoscope',
    items: [
      {
        title: 'Active Medicare interest',
        body: 'Interest in Medicare plan options is confirmed before transfer.',
      },
      {
        title: 'Parts A and B verified',
        body: 'Confirms they have Medicare Parts A and B.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'Confirms they don’t live in a nursing home or assisted living facility.',
      },
      {
        title: 'Independent decision maker',
        body: 'Confirms they don’t need a power of attorney to make financial decisions.',
      },
      {
        title: 'Active bank account or credit card',
        body: 'Confirms they have an active bank account or credit card.',
      },
      {
        title: 'Ready to talk to a licensed agent',
        body: 'Agrees to speak with a licensed agent about their plan options.',
      },
    ],
  },
} as const;

export const pricing = {
  ppa: {
    name: 'Pay-Per-Application',
    href: '/pay-per-application',
    apply: '/get-started?program=ppa',
    unit: 'per submitted application',
    rows: [
      { vertical: 'Final Expense', from: 199 },
      { vertical: 'Medicare', from: 199 },
    ],
    note: 'Zero cost per call. You pay strictly on results, and your rate moves with your agents’ conversion.',
    cta: 'Apply for Pay-Per-App',
    bullets: [
      '$0 if no application is submitted',
      'Calls in the browser, included. No dialer to buy.',
      'Every application tied to its call recording',
      'Prepaid balance. No surprise invoices.',
    ],
  },
  ppc: {
    name: 'Pay-Per-Call',
    href: '/pay-per-call',
    apply: '/get-started?program=ppc',
    unit: 'per billable call',
    rows: [
      { vertical: 'Final Expense', from: 25 },
      { vertical: 'Medicare', from: 25 },
    ],
    note: 'Predictable volume with buffer protection. Your final price depends on your filters: states, ages and buffer time.',
    cta: 'Set Up Pay-Per-Call',
    bullets: [
      'Calls that end inside your buffer are free',
      'Take calls on your phones, your dialer or the dashboard',
      'Filter by state, caller age and hours',
      'Every call in your log with its length, recording and billable status',
    ],
  },
} as const;

export const ppcFilters = [
  {
    id: 'states',
    icon: 'map-pin',
    title: 'States',
    body: 'Only callers in the states your agents are licensed in.',
  },
  { id: 'ages', icon: 'users', title: 'Ages', body: 'The caller age range your carriers write.' },
  {
    id: 'buffer',
    icon: 'calendar-clock',
    title: 'Buffer time',
    body: 'How long a call has to last before you pay for it.',
  },
] as const;
