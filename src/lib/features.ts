/** Portal features, shared by the home showcase and /platform. `shot` names a crop in Shot.astro. */
export const features = [
  {
    id: 'agents',
    tab: 'Your agents',
    shot: 'floor-cards',
    title: 'Your agents, live',
    alt: 'Two agent cards showing each agent on a call, with calls, talk time, applications and closing percentage today',
    bullets: [
      'Who’s ready, who’s on a call, and for how long',
      'Calls, talk time and applications today',
      'Each agent’s calls and recordings',
    ],
  },
  {
    id: 'customers',
    tab: 'Customers',
    shot: 'customers',
    title: 'Every agent’s own customers',
    alt: 'An agent’s customer list with prospects, stages, follow-ups and states',
    bullets: [
      'Each agent sees only their own customers',
      'The owner sees everyone’s',
      'Notes, tasks and follow-ups on every customer',
    ],
  },
  {
    id: 'applications',
    tab: 'Applications',
    shot: 'applications',
    title: 'Every application, logged on the call',
    alt: 'Applications page listing carrier, plan, face amount, premium and agent for each application',
    bullets: [
      'Carrier, face amount and premium',
      'Open the customer behind every application',
      'Closing percentage by agent',
    ],
  },
  {
    id: 'statements',
    tab: 'Statements',
    shot: 'statements',
    title: 'Your balance, spend and top-ups',
    alt: 'Statements panel with a PDF and CSV download for each month',
    bullets: [
      'Prepaid balance and what you’ve spent',
      'Request a top-up in one click',
      'Download a monthly statement for any month',
    ],
  },
] as const;
