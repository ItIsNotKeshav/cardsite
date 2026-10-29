import { GROCERY_CAP, POINT_VALUE } from '../data/card.js';

const money = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-US')}`;
const int = (n) => Math.round(n).toLocaleString('en-US');

// The plan tabs, the earn rates they show and the calculator under them.
export function initRewards({ gsap, reduce, scrollTo }) {
  const section = document.querySelector('[data-rewards]');
  if (!section) return;
  const plans = JSON.parse(section.dataset.plans);
  const tabs = [...section.querySelectorAll('[data-plan-tab]')];
  const pill = section.querySelector('[data-plan-pill]');
  const sliders = [...section.querySelectorAll('[data-spend]')];
  let plan = plans.find((p) => p.featured) || plans[0];

  // Numbers count to their new value rather than jumping.
  const shown = new WeakMap();
  function count(el, to, format, duration = 0.6) {
    const from = shown.get(el) ?? to;
    shown.set(el, to);
    if (reduce || from === to) {
      el.textContent = format(to);
      return;
    }
    const v = { n: from };
    gsap.killTweensOf(el.__counter || {});
    el.__counter = v;
    gsap.to(v, { n: to, duration, ease: 'expo.out', onUpdate: () => { el.textContent = format(v.n); } });
  }
  const set = (sel, to, format, root = section) => root.querySelectorAll(sel).forEach((el) => count(el, to, format));

  function movePill(animate) {
    const tab = tabs.find((t) => t.dataset.planTab === plan.id);
    const box = { x: tab.offsetLeft, width: tab.offsetWidth };
    if (animate && !reduce) gsap.to(pill, { ...box, duration: 0.55, ease: 'expo.out' });
    else gsap.set(pill, box);
  }

  function calc() {
    const spend = {};
    for (const s of sliders) {
      const v = Number(s.value);
      spend[s.dataset.spend] = v * 12;
      s.style.setProperty('--fill', `${(v / Number(s.max)) * 100}%`);
      section.querySelector(`[data-spend-out="${s.dataset.spend}"]`).textContent = money(v);
    }
    let points = 0;
    for (const [cat, yearly] of Object.entries(spend)) {
      if (cat === 'groceries' && plan.rates.groceries > plan.rates.other) {
        const boosted = Math.min(yearly, GROCERY_CAP);
        points += boosted * plan.rates.groceries + (yearly - boosted) * plan.rates.other;
      } else {
        points += yearly * plan.rates[cat];
      }
    }
    const earned = points * POINT_VALUE;
    const monthly = Object.values(spend).reduce((a, b) => a + b, 0) / 12;
    const gotBonus = monthly * plan.bonus.months >= plan.bonus.spend;
    const bonus = gotBonus ? plan.bonus.points * POINT_VALUE : 0;
    count(section.querySelector('[data-out="points"]'), points, int);
    count(section.querySelector('[data-out="earned"]'), earned, money);
    count(section.querySelector('[data-out="bonus"]'), bonus, money);
    count(section.querySelector('[data-out="fee"]'), -plan.fee, money);
    count(section.querySelector('[data-out="first"]'), earned + bonus - plan.fee, money, 0.9);
    count(section.querySelector('[data-out="after"]'), earned - plan.fee, money);
    section.querySelector('[data-out="bonus"]').closest('div').classList.toggle('is-missed', !gotBonus);
  }

  function choose(id, animate = true) {
    plan = plans.find((p) => p.id === id) || plan;
    tabs.forEach((t) => t.setAttribute('aria-checked', String(t.dataset.planTab === plan.id)));
    movePill(animate);
    for (const [cat, rate] of Object.entries(plan.rates)) {
      set(`[data-rate="${cat}"]`, rate, (n) => `${Math.round(n * 2) / 2}%`);
      section.querySelectorAll(`[data-points="${cat}"]`).forEach((el) => { el.textContent = `${rate}x`; });
    }
    set('[data-bonus-points]', plan.bonus.points, int);
    set('[data-bonus-value]', plan.bonus.points * POINT_VALUE, money);
    section.querySelector('[data-bonus-spend]').textContent = money(plan.bonus.spend);
    section.querySelector('[data-bonus-intro]').textContent = plan.intro ? `, plus ${plan.intro} on purchases and balance transfers` : '';
    section.querySelector('[data-calc-plan]').textContent = plan.name;
    calc();
  }

  tabs.forEach((t) => t.addEventListener('click', () => choose(t.dataset.planTab)));
  // Arrow keys move between plans, as in any radio group.
  section.querySelector('[role="radiogroup"]').addEventListener('keydown', (e) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const i = (tabs.findIndex((t) => t.dataset.planTab === plan.id) + dir + tabs.length) % tabs.length;
    choose(tabs[i].dataset.planTab);
    tabs[i].focus();
  });
  tabs.forEach((t) => { t.tabIndex = t.dataset.planTab === plan.id ? 0 : -1; });
  section.querySelector('[role="radiogroup"]').addEventListener('focusin', () => {
    tabs.forEach((t) => { t.tabIndex = t.dataset.planTab === plan.id ? 0 : -1; });
  });

  sliders.forEach((s) => s.addEventListener('input', calc));

  document.querySelectorAll('[data-choose-plan]').forEach((b) => b.addEventListener('click', () => {
    choose(b.dataset.choosePlan);
    scrollTo('#rewards');
  }));

  window.addEventListener('resize', () => movePill(false));
  document.fonts.ready.then(() => movePill(false));
  choose(plan.id, false);
}
