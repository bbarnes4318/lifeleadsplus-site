/** The offer: caller qualification and pricing. Single source for every page that shows them. */
export const qualifications = {
  'final-expense': {
    label: 'Final Expense',
    icon: 'shield-check',
    items: [
      {
        title: 'Interested in final expense',
        body: 'Confirmed interested in final expense coverage before transfer.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'Confirms they don’t live in a nursing home or assisted living facility.',
      },
      {
        title: 'Makes their own financial decisions',
        body: 'Confirms they don’t need a power of attorney to make financial decisions.',
      },
      {
        title: 'Age 40 to 85',
        body: 'Confirms they’re between 40 and 85.',
      },
      {
        title: 'Agrees to speak with a licensed agent',
        body: 'Agrees to talk with a licensed agent about their plan options.',
      },
    ],
  },
  medicare: {
    label: 'Medicare',
    icon: 'stethoscope',
    items: [
      {
        title: 'Interested in Medicare',
        body: 'Confirmed interested in Medicare plan options before transfer.',
      },
      {
        title: 'Has Medicare Parts A and B',
        body: 'Confirms they have Medicare Parts A and B.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'Confirms they don’t live in a nursing home or assisted living facility.',
      },
      {
        title: 'Makes their own financial decisions',
        body: 'Confirms they don’t need a power of attorney to make financial decisions.',
      },
      {
        title: 'Agrees to speak with a licensed agent',
        body: 'Agrees to talk with a licensed agent about their plan options.',
      },
    ],
  },
} as const;

export const pricing = {
  ppa: {
    name: 'Pay per application',
    href: '/pay-per-application',
    apply: '/get-started?program=ppa',
    unit: 'per submitted application',
    rows: [
      { vertical: 'Final Expense', from: 199 },
      { vertical: 'Medicare', from: 199 },
    ],
    note: 'Your rate goes up or down with your agents’ conversion.',
    bullets: [
      'No application, no charge',
      'Agents take calls in their browser. No dialer to buy.',
      'Every application linked to its call and recording',
      'Prepaid balance. No surprise invoices.',
    ],
  },
  ppc: {
    name: 'Pay per call',
    href: '/pay-per-call',
    apply: '/get-started?program=ppc',
    unit: 'per billable call',
    rows: [
      { vertical: 'Final Expense', from: 25 },
      { vertical: 'Medicare', from: 25 },
    ],
    note: 'Your final price depends on your filters: states, ages and buffer time.',
    bullets: [
      'Calls that end inside your buffer are free',
      'Take calls on your phones, your dialer or the portal',
      'Every call recorded in your call log',
      'Prepaid balance. No surprise invoices.',
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
