export const CATEGORIES = ['Programs', 'Pricing', 'Qualification', 'Billing', 'Portal'] as const;
export type Category = (typeof CATEGORIES)[number];

export const faqs: [string, string, Category][] = [
  ['What verticals do you offer?', 'Final Expense and Medicare.', 'Programs'],
  [
    'What’s the difference between pay per application and pay per call?',
    'Pay per application charges for submitted applications your agents log in the portal. Pay per call charges for calls that pass the buffer on your agreement.',
    'Programs',
  ],
  [
    'What do I need to start?',
    'Licensed agents in the states you want calls from, a signed agreement and a funded prepaid balance.',
    'Programs',
  ],
  [
    'Can I choose my states and hours?',
    'Yes. Calls only come from your licensed states, during your delivery hours, up to your daily cap.',
    'Programs',
  ],
  [
    'How fast can I start?',
    'Once your agreement is signed and your balance is funded, we schedule your first delivery day.',
    'Programs',
  ],
  [
    'How much does it cost?',
    'Pay per application starts at $199 per submitted application for Final Expense and Medicare, and your rate moves up or down with your agents’ conversion. Pay per call starts at $25 per billable call for Final Expense and Medicare, and your final price depends on your filters: states, ages and buffer time.',
    'Pricing',
  ],
  [
    'Why does my pay per application rate change?',
    'Your rate follows your agents’ conversion. It starts at $199 per submitted application and moves up or down as conversion changes.',
    'Pricing',
  ],
  [
    'What changes my pay per call price?',
    'Pay per call starts at $25 per billable call for Final Expense and Medicare. Your final price depends on three filters: the states you want calls from, the caller ages you want, and your buffer time.',
    'Pricing',
  ],
  [
    'Can I change my filters later?',
    'Yes. Tell us the states, ages or buffer time you want and we’ll send your updated rate.',
    'Pricing',
  ],
  [
    'How are Final Expense callers qualified?',
    'Interest in final expense is established, and the caller answers yes to: not living in a nursing home or assisted living facility; not needing a power of attorney to make financial decisions; being between the ages of 40 and 85; and agreeing to speak with a licensed agent to learn plan options.',
    'Qualification',
  ],
  [
    'How are Medicare callers qualified?',
    'Interest in Medicare is established, and the caller answers yes to: having Medicare Parts A and B; not living in a nursing home or assisted living facility; not needing a power of attorney to make financial decisions; and agreeing to speak with a licensed agent to learn plan options.',
    'Qualification',
  ],
  [
    'Are these live calls or leads?',
    'Live calls. The caller is transferred to your agent while still on the line.',
    'Qualification',
  ],
  [
    'How do I pay?',
    'Programs are prepaid. You fund a balance and calls or applications draw from it.',
    'Billing',
  ],
  [
    'What if a call doesn’t meet my agreement?',
    'Request a return from your call log. Each request is reviewed and the decision shows in your portal.',
    'Billing',
  ],
  [
    'Can I get a statement for my accountant?',
    'Yes. Download a statement for any month from your portal.',
    'Billing',
  ],
  [
    'Do I have to use the portal?',
    'For pay per application, yes: your agents take calls and log applications there. For pay per call, you can take calls on your own phones or dialer and use the portal for your call log, recordings, spend and statements.',
    'Portal',
  ],
  [
    'Do I need a phone system or dialer?',
    'No. Your agents can take calls in the portal in their browser. On pay per call, we can also transfer calls to your own phones or dialer.',
    'Portal',
  ],
  ['Can I listen to my calls?', 'Yes. Every call in your call log has its recording.', 'Portal'],
  ['How do I log in?', 'Use Client login at the top of this page.', 'Portal'],
];

/** Question/answer pairs for a FaqStrip, looked up by question. */
export const pick = (...questions: string[]): [string, string][] =>
  questions.map((q) => {
    const f = faqs.find(([fq]) => fq === q);
    if (!f) throw new Error(`No FAQ "${q}"`);
    return [f[0], f[1]];
  });
