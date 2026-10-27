import { createCard } from './card.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FIELD = { silver: '#ff4499', black: '#bb4400', gold: '#12271f', white: '#55ff99' };
const LABEL = { silver: 'Silver', black: 'Black', gold: 'Gold', white: 'White' };

let card = null;
try {
  card = createCard(document.getElementById('stage'));
} catch (err) {
  root.classList.add('no-webgl');
  console.warn('Card scene unavailable:', err);
}

/* ---------- Finish and engraving: the one live thing ---------- */

const nameInput = document.getElementById('engrave');
const requestLink = document.querySelector('[data-request]');
const themeMeta = document.querySelector('meta[name="theme-color"]');

const cleanName = (v) => v.toUpperCase().replace(/[^A-Z .'\-]/g, '').replace(/\s+/g, ' ').slice(0, 22);

function updateRequest() {
  const finish = LABEL[root.dataset.finish];
  const name = cleanName(nameInput.value).trim() || '(to confirm)';
  const subject = `Obverse card request: ${finish}`;
  const body = `Hello,\n\nI would like to request an Obverse card.\n\nFinish: ${finish}\nName on the card: ${name}\n\nThank you.`;
  requestLink.href = `mailto:hello@obverse.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function applyFinish(name, animate = true) {
  root.dataset.finish = name;
  document.querySelectorAll('[data-finish-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finishBtn === name)));
  document.querySelectorAll('input[name="finish"]').forEach((i) => { i.checked = i.value === name; });
  themeMeta.content = FIELD[name];
  card?.setFinish(name, animate);
  try { localStorage.setItem('obverse-finish', name); } catch (e) { /* storage is a convenience only */ }
  updateRequest();
}

document.querySelectorAll('[data-finish-btn]').forEach((b) => b.addEventListener('click', () => applyFinish(b.dataset.finishBtn)));
document.querySelectorAll('input[name="finish"]').forEach((i) => i.addEventListener('change', () => applyFinish(i.value)));
document.querySelector('[data-chooser]').addEventListener('submit', (e) => e.preventDefault());

nameInput.addEventListener('input', () => {
  const clean = cleanName(nameInput.value);
  if (clean !== nameInput.value) nameInput.value = clean;
  card?.setName(clean.trim());
  updateRequest();
});

applyFinish(FIELD[root.dataset.finish] ? root.dataset.finish : 'black', false);

/* ---------- Smooth scroll ---------- */

let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0 });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });
});

/* ---------- Navigation turns solid once the hero has gone ---------- */

const nav = document.querySelector('[data-nav]');
ScrollTrigger.create({
  trigger: '.hero',
  start: () => `bottom top+=${nav.offsetHeight}`,
  onEnter: () => nav.classList.add('is-solid'),
  onLeaveBack: () => nav.classList.remove('is-solid'),
});

/* ---------- Hero entrance ---------- */

document.querySelectorAll('[data-split]').forEach((el) => {
  const text = el.textContent.trim();
  el.textContent = '';
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch;
    s.setAttribute('aria-hidden', 'true');
    el.append(s);
  }
});

const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
if (reduce) {
  intro.from('.hero .char, .hero [data-intro]', { opacity: 0, duration: 0.6 });
} else {
  intro.from('.hero .char', { yPercent: 110, duration: 1.2, stagger: 0.04 }, 0.1)
    .from('.hero [data-intro]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.7);
  if (card) {
    intro.from(card.offset, { y: 0.75, rx: 0.9, ry: -Math.PI * 1.25, scale: 0.7, duration: 2.1, ease: 'expo.out' }, 0);
  }
}

/* ---------- The story: one pose per chapter, scrubbed between them ---------- */

const PI = Math.PI;
const DESK = {
  hero: { x: 0.5, y: 0.54, s: 0.3, rx: -0.3, ry: -0.45, rz: 0.22, explode: 0, idle: 1 },
  front: { x: 0.71, y: 0.53, s: 0.36, rx: -0.06, ry: -0.28, rz: -0.04, explode: 0, idle: 0.7 },
  weight: { x: 0.29, y: 0.54, s: 0.42, rx: -1.22, ry: 0.42, rz: -0.22, explode: 0, idle: 0.4 },
  layersIn: { x: 0.7, y: 0.53, s: 0.3, rx: -0.62, ry: -0.62, rz: 0.12, explode: 0, idle: 0.3 },
  layersOut: { x: 0.7, y: 0.52, s: 0.27, rx: -0.74, ry: -0.78, rz: 0.16, explode: 1, idle: 0.3 },
  backIn: { x: 0.3, y: 0.53, s: 0.37, rx: -0.08, ry: 0.32, rz: 0, explode: 0, idle: 0.4 },
  backOut: { x: 0.3, y: 0.53, s: 0.37, rx: -0.08, ry: PI + 0.14, rz: 0, explode: 0, idle: 0.4 },
  choose: { x: 0.71, y: 0.53, s: 0.37, rx: -0.1, ry: PI * 2 - 0.22, rz: 0.03, explode: 0, idle: 0.8 },
};
const PHONE = {
  hero: { x: 0.5, y: 0.55, s: 0.8, rx: -0.3, ry: -0.45, rz: 0.22, explode: 0, idle: 1 },
  front: { x: 0.5, y: 0.27, s: 0.74, rx: -0.06, ry: -0.28, rz: -0.04, explode: 0, idle: 0.7 },
  weight: { x: 0.5, y: 0.25, s: 0.8, rx: -1.22, ry: 0.42, rz: -0.22, explode: 0, idle: 0.4 },
  layersIn: { x: 0.5, y: 0.27, s: 0.62, rx: -0.62, ry: -0.62, rz: 0.12, explode: 0, idle: 0.3 },
  layersOut: { x: 0.5, y: 0.26, s: 0.56, rx: -0.74, ry: -0.78, rz: 0.16, explode: 1, idle: 0.3 },
  backIn: { x: 0.5, y: 0.27, s: 0.74, rx: -0.08, ry: 0.32, rz: 0, explode: 0, idle: 0.4 },
  backOut: { x: 0.5, y: 0.27, s: 0.74, rx: -0.08, ry: PI + 0.14, rz: 0, explode: 0, idle: 0.4 },
  choose: { x: 0.5, y: 0.22, s: 0.66, rx: -0.1, ry: PI * 2 - 0.22, rz: 0.03, explode: 0, idle: 0.8 },
};

if (card) {
  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 768px)', phone: '(max-width: 767.98px)' }, (ctx) => {
    const K = ctx.conditions.desk ? DESK : PHONE;
    Object.assign(card.pose, K.hero);
    // [trigger, from, to, start, end]. The hero-to-front move happens behind the museum curtain.
    const steps = [
      ['#history', K.hero, K.front, 'top top', 'bottom bottom'],
      ['#weight', K.front, K.weight],
      ['#layers', K.weight, K.layersIn],
      ['#layers', K.layersIn, K.layersOut, 'top top', 'bottom bottom'],
      ['#reverse', K.layersOut, K.backIn],
      ['#reverse', K.backIn, K.backOut, 'top top', 'bottom bottom'],
      ['#choose', K.backOut, K.choose],
    ];
    steps.forEach(([trigger, from, to, start = 'top bottom', end = 'top top']) => {
      gsap.fromTo(card.pose, { ...from }, {
        ...to,
        ease: 'none',
        immediateRender: false,
        scrollTrigger: { trigger, start, end, scrub: reduce ? true : 1 },
      });
    });
  });
}

/* ---------- Section entrances ---------- */

gsap.utils.toArray('[data-reveal]').forEach((group) => {
  gsap.from(group.children, {
    y: reduce ? 0 : 28,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: group, start: 'top 85%', once: true },
  });
});
gsap.utils.toArray('[data-reveal-self], .coin').forEach((el) => {
  gsap.from(el, {
    y: reduce ? 0 : 32,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
});

/* ---------- Coins drift as they pass ---------- */

if (!reduce) {
  gsap.utils.toArray('.coin img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.14, yPercent: -3 }, {
      scale: 1,
      yPercent: 3,
      ease: 'none',
      scrollTrigger: { trigger: img.closest('.coin'), start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ---------- 28 grams, counted ---------- */

const count = document.querySelector('[data-count]');
if (count && !reduce) {
  const target = Number(count.dataset.count);
  const n = { v: 0 };
  count.textContent = '0';
  gsap.to(n, {
    v: target,
    duration: 1.6,
    ease: 'power2.out',
    scrollTrigger: { trigger: count, start: 'top 85%', once: true },
    onUpdate: () => { count.textContent = String(Math.round(n.v)); },
  });
}

/* ---------- The name returns at full width in the footer ---------- */

const fit = document.querySelector('[data-fit]');
function fitFooter() {
  const box = fit.parentElement;
  fit.style.fontSize = '100px';
  box.style.fontSize = '100px';
  const size = (100 * box.clientWidth) / fit.getBoundingClientRect().width;
  box.style.fontSize = `${size}px`;
  fit.style.fontSize = '';
}

document.fonts.ready.then(() => {
  fitFooter();
  ScrollTrigger.refresh();
});
window.addEventListener('resize', fitFooter);
