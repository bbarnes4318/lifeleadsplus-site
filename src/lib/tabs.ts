/** ARIA tabs pattern: click or Left/Right/Home/End selects a tab and shows its panel. */
export function initTabs(list: HTMLElement, onChange?: (index: number) => void) {
  const tabs = [...list.querySelectorAll<HTMLElement>('[role=tab]')];
  const select = (index: number, focus = false) => {
    tabs.forEach((tab, j) => {
      const on = j === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !on;
    });
    if (focus) tabs[index].focus();
    onChange?.(index);
  };
  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement as HTMLElement);
    const n = tabs.length;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    select(next % n, true);
  });
}
