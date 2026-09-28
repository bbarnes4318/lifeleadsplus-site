/** The offer: caller qualification and pricing. Single source for every page that shows them. */
export const qualifications = {
  'final-expense': {
    label: 'Final Expense',
    icon: 'shield-check',
    items: [
      {
        title: 'Interested in final expense',
        body: 'Interest in final expense coverage is established before transfer.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'The caller answers yes to not living in a nursing home or assisted living facility.',
      },
      {
        title: 'Makes their own financial decisions',
        body: 'The caller answers yes to not needing a power of attorney to make financial decisions.',
      },
      {
        title: 'Age 40 to 85',
        body: 'The caller answers yes to being between the ages of 40 and 85.',
      },
      {
        title: 'Agrees to speak with a licensed agent',
        body: 'The caller answers yes to speaking with a licensed agent to learn their plan options.',
      },
    ],
  },
  medicare: {
    label: 'Medicare',
    icon: 'stethoscope',
    items: [
      {
        title: 'Interested in Medicare',
        body: 'Interest in Medicare plan options is established before transfer.',
      },
      {
        title: 'Has Medicare Parts A and B',
        body: 'The caller answers yes to having Medicare Parts A and B.',
      },
      {
        title: 'Not in a nursing home or assisted living',
        body: 'The caller answers yes to not living in a nursing home or assisted living facility.',
      },
      {
        title: 'Makes their own financial decisions',
        body: 'The caller answers yes to not needing a power of attorney to make financial decisions.',
      },
      {
        title: 'Agrees to speak with a licensed agent',
        body: 'The caller answers yes to speaking with a licensed agent to learn their plan options.',
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
    note: 'Your rate moves up or down with your agents’ conversion.',
    bullets: [
      'Pay only for applications your agents submit',
      'Agents take calls in the portal, in their browser',
      'Every application tied to its call and recording',
      'Prepaid balance',
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
      'Pay only for calls that pass your buffer',
      'Take calls on your phones, your dialer or the portal',
      'Every call recorded in your call log',
      'Prepaid balance',
    ],
  },
} as const;

export const ppcFilters = [
  {
    id: 'states',
    icon: 'map-pin',
    title: 'States',
    body: 'Choose the states you’re licensed in. Calls only come from those states.',
  },
  { id: 'ages', icon: 'users', title: 'Ages', body: 'Choose the caller age range you want.' },
  {
    id: 'buffer',
    icon: 'calendar-clock',
    title: 'Buffer time',
    body: 'Choose how long a call must last before it’s billable.',
  },
] as const;
