/** Portal features, shared by the home showcase and /platform. `shot` names a crop in BrowserFrame.astro. */
export const features = [
  {
    id: 'agents',
    tab: 'Your agents',
    shot: 'agents-floor',
    title: 'Know who’s selling right now.',
    alt: 'Agent tiles showing who is ready and who is on a call, with calls, talk time, applications and closing percentage today',
    bullets: [
      'See who’s ready, who’s on a call and for how long',
      'Calls, talk time and applications for every agent, today',
      'Pull up any agent’s calls and recordings',
    ],
  },
  {
    id: 'customers',
    tab: 'Customers',
    shot: 'customers',
    title: 'No caller goes cold.',
    alt: 'An agent’s customer list with prospects, stages, follow-ups and states',
    bullets: [
      'A built-in CRM for every agent, no extra software',
      'Each agent sees their own customers. You see everyone’s.',
      'Notes, tasks and follow-ups on every customer',
    ],
  },
  {
    id: 'applications',
    tab: 'Applications',
    shot: 'applications',
    title: 'Every sale, tied to the call that made it.',
    alt: 'Applications page listing carrier, plan, face amount, premium and agent for each application',
    bullets: [
      'Carrier, face amount and premium on every application',
      'Open the call and customer behind any application',
      'Closing percentage by agent',
    ],
  },
  {
    id: 'statements',
    tab: 'Statements',
    shot: 'statements',
    title: 'Know exactly where your money went.',
    alt: 'Statements panel with a PDF and CSV download for each month',
    bullets: [
      'Your prepaid balance and every charge against it',
      'Request a top-up in one click',
      'A downloadable statement for every month',
    ],
  },
] as const;
