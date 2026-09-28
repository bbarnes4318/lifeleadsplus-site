import { initTabs } from '../lib/tabs';

// Scroll reveal. CSS only hides [data-reveal] under `.js` + no-preference, so this is safe to skip.
document.querySelectorAll('[data-reveal-group]').forEach((group) =>
  group.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
    el.style.setProperty('--i', String(i));
  }),
);
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }),
  { rootMargin: '0px 0px -40px 0px', threshold: 0.1 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

document.querySelectorAll<HTMLElement>('[role=tablist][data-tabs]').forEach((l) => initTabs(l));
