export const CATEGORIES = ['Programs', 'Pricing', 'Qualification', 'Billing', 'Portal'] as const;
export type Category = (typeof CATEGORIES)[number];

export const faqs: [string, string, Category][] = [
  [
    'How does pay per application work?',
    'We send live transfers to your agents. Your agent takes the call, pitches, and submits the application. If they submit it, you’re charged your pay per application rate. If the call drops, the caller hangs up, or it ends without an application, you pay $0.',
    'Programs',
  ],
  [
    'How is an application verified?',
    'Your agents log every application in the portal during the call. Each one is tied to its call and its recording, so you can check exactly what you’re charged for.',
    'Programs',
  ],
  [
    'What happens if a call ends quickly on pay per call?',
    'Every pay per call agreement has a buffer time. Any call that ends before your buffer is free.',
    'Programs',
  ],
  [
    'Can I use this with my existing dialer or CRM?',
    'Yes. Your agents can take calls in the portal with no extra software. On pay per call, we can also transfer calls to your own phones or dialer. Pay per application runs in the portal.',
    'Programs',
  ],
  ['What verticals do you offer?', 'Final Expense and Medicare.', 'Programs'],
  [
    'What’s the difference between pay per application and pay per call?',
    'Pay per application charges you for each application your agents submit in the portal. Pay per call charges you for each call that lasts past the buffer in your agreement.',
    'Programs',
  ],
  [
    'What do I need to start?',
    'Licensed agents in the states you want calls from, a signed agreement and a funded prepaid balance.',
    'Programs',
  ],
  [
    'Can I choose my states and hours?',
    'Yes. Calls come only from your licensed states, during your delivery hours, up to your daily cap.',
    'Programs',
  ],
  [
    'How fast can I start?',
    'Once your agreement is signed and your balance is funded, we schedule your first delivery day.',
    'Programs',
  ],
  [
    'How much does it cost?',
    'Pay per application starts at $199 per submitted application for Final Expense and Medicare, and your rate moves up or down with your agents’ conversion. Pay per call starts at $25 per billable call for both, and your final price depends on your states, caller ages and buffer time.',
    'Pricing',
  ],
  [
    'Why does my pay per application rate change?',
    'Your rate follows your agents’ conversion. It starts at $199 per submitted application and moves as their conversion changes.',
    'Pricing',
  ],
  [
    'What changes my pay per call price?',
    'Pay per call starts at $25 per billable call for Final Expense and Medicare. Your final price depends on three filters: the states you want calls from, the caller ages you want and your buffer time.',
    'Pricing',
  ],
  [
    'Can I change my filters later?',
    'Yes. Tell us the states, ages or buffer time you want and we’ll send an updated rate.',
    'Pricing',
  ],
  [
    'How are Final Expense callers qualified?',
    'Each caller says they’re interested in final expense coverage. They also confirm they don’t live in a nursing home or assisted living facility, don’t need a power of attorney to make financial decisions, are between 40 and 85, and will talk with a licensed agent about plan options.',
    'Qualification',
  ],
  [
    'How are Medicare callers qualified?',
    'Each caller says they’re interested in Medicare plan options. They also confirm they have Medicare Parts A and B, don’t live in a nursing home or assisted living facility, don’t need a power of attorney to make financial decisions, and will talk with a licensed agent about plan options.',
    'Qualification',
  ],
  [
    'Are these live calls or leads?',
    'Live calls. The caller is still on the line when they’re transferred to your agent. There’s no list to chase.',
    'Qualification',
  ],
  [
    'Who else handles my calls?',
    'No outside vendors sit between the caller and your agent. Screening, routing, transfer, recording and your portal all run in one closed system.',
    'Qualification',
  ],
  [
    'How do I pay?',
    'Programs are prepaid. You fund a balance, and calls or applications draw from it.',
    'Billing',
  ],
  [
    'What if a call doesn’t meet my agreement?',
    'Request a return from your call log within 30 days of the call. We review every request, and the decision shows in your portal.',
    'Billing',
  ],
  [
    'Can I get a statement for my accountant?',
    'Yes. Download a statement for any month from your portal.',
    'Billing',
  ],
  [
    'Do I have to use the portal?',
    'On pay per application, yes: your agents take calls and log applications there. On pay per call, you can take calls on your own phones or dialer and use the portal for your call log, recordings, spend and statements.',
    'Portal',
  ],
  [
    'Do I need a phone system or dialer?',
    'No. Your agents can take calls in their browser through the portal. On pay per call, we can also transfer calls to your own phones or dialer.',
    'Portal',
  ],
  ['Can I listen to my calls?', 'Yes. Every call in your call log has its recording.', 'Portal'],
  ['How do I log in?', 'Use Client login at the top of any page.', 'Portal'],
];

/** Question/answer pairs for a FaqStrip, looked up by question. */
export const pick = (...questions: string[]): [string, string][] =>
  questions.map((q) => {
    const f = faqs.find(([fq]) => fq === q);
    if (!f) throw new Error(`No FAQ "${q}"`);
    return [f[0], f[1]];
  });
