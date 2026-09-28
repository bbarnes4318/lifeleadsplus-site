import { initTabs } from '../lib/tabs';
import { track, captureAttribution } from '../lib/track';

captureAttribution();

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

// Screenshot frames that scroll sideways fade their right edge until scrolled to the end.
document.querySelectorAll<HTMLElement>('[data-bf-view]').forEach((view) => {
  const update = () =>
    view.toggleAttribute('data-more', view.scrollLeft + view.clientWidth < view.scrollWidth - 4);
  view.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(view);
});

// One delegated listener for CTA and phone clicks.
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a');
  if (!a) return;
  if (a.dataset.cta) track('cta_click', { location: a.dataset.cta });
  if (a.getAttribute('href')?.startsWith('tel:')) track('phone_click');
});
