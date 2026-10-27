import { createCard } from './card.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const scrub = reduce ? true : 1;

const BG = { silver: '#0a0a0b', black: '#ff4499', gold: '#0a0a0b', white: '#0a0a0b' };
const NOTE = {
  silver: 'Bead-blasted bare titanium.',
  black: 'Black titanium with a diamond-like carbon coat.',
  gold: 'Titanium with a gold titanium-nitride coat.',
  white: 'White ceramic fired over titanium.',
};

let card = null;
try {
  card = createCard(document.getElementById('canvas'));
} catch (err) {
  root.classList.add('no-webgl');
  console.warn('Card scene unavailable:', err);
}

/* ---------- Finish and engraving ---------- */

const nameInput = document.getElementById('engrave');
const note = document.querySelector('[data-finish-note]');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const wipe = document.querySelector('[data-wipe]');
let wipeTl = null;

const cleanName = (v) => v.toUpperCase().replace(/[^A-Z .'\-]/g, '').replace(/\s+/g, ' ').slice(0, 20);

function applyFinish(name, animate = true) {
  const previous = root.dataset.finish;
  document.querySelectorAll('[data-finish-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finishBtn === name)));
  document.querySelectorAll('input[name="finish"]').forEach((i) => { i.checked = i.value === name; });
  note.textContent = NOTE[name];
  themeMeta.content = BG[name];
  try { localStorage.setItem('heavy-metal-finish', name); } catch (e) { /* storage is a convenience only */ }
  card?.setFinish(name, animate);

  const swap = () => { root.dataset.finish = name; };
  wipeTl?.progress(1).kill();
  if (!animate || reduce || BG[previous] === BG[name]) {
    swap();
    return;
  }
  // The new ground swipes across the screen behind the spinning card.
  wipe.style.background = BG[name];
  wipeTl = gsap.timeline()
    .set(wipe, { visibility: 'visible', clipPath: 'inset(0 100% 0 0)' })
    .to(wipe, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power3.inOut' })
    .add(swap)
    .to(wipe, { clipPath: 'inset(0 0 0 100%)', duration: 0.55, ease: 'power3.inOut' })
    .set(wipe, { visibility: 'hidden' });
}

document.querySelectorAll('[data-finish-btn]').forEach((b) => b.addEventListener('click', () => applyFinish(b.dataset.finishBtn)));
document.querySelectorAll('input[name="finish"]').forEach((i) => i.addEventListener('change', () => applyFinish(i.value)));
document.querySelector('[data-chooser]').addEventListener('submit', (e) => e.preventDefault());

nameInput.addEventListener('input', () => {
  const clean = cleanName(nameInput.value);
  if (clean !== nameInput.value) nameInput.value = clean;
  card?.setName(clean.trim());
});

applyFinish(BG[root.dataset.finish] ? root.dataset.finish : 'black', false);

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
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else if (target === 0) window.scrollTo({ top: 0 });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });
});

/* ---------- The cursor dot the card follows ---------- */

const cursor = document.querySelector('[data-cursor]');
if (finePointer && !reduce) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    cursor.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
    cursor.classList.toggle('is-big', Boolean(e.target.closest('a, button, label, input')));
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('a, button, label, input')) cursor.classList.add('is-drag');
  });
  window.addEventListener('pointerup', () => cursor.classList.remove('is-drag'));
  root.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
} else {
  cursor.remove();
  root.classList.add('no-cursor');
}

/* ---------- Giant words fill the width, within a height cap ---------- */

function fitAll() {
  document.querySelectorAll('[data-fit]').forEach((span) => {
    const box = span.parentElement;
    box.style.fontSize = '100px';
    const fit = (100 * box.clientWidth) / span.getBoundingClientRect().width;
    const cap = Number(span.dataset.fit) * window.innerHeight;
    box.style.fontSize = `${Math.min(fit, cap)}px`;
  });
}
fitAll();

/* ---------- Hero: the words swipe in from both sides, the card drops between them ---------- */

const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
if (reduce) {
  intro.from('.hero .giant-line > span, .hero [data-intro]', { opacity: 0, duration: 0.6 });
} else {
  intro.from('.hero [data-from="left"] > span', { xPercent: -110, duration: 1.4 }, 0.1)
    .from('.hero [data-from="right"] > span', { xPercent: 110, duration: 1.4 }, 0.18)
    .from('.hero [data-intro]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.7);
  if (card) intro.from(card.offset, { y: -1.1, rx: 1.2, ry: Math.PI * 2, scale: 0.5, duration: 2.2 }, 0);

  // Leaving the hero, the two words part like a swipe.
  const part = (sel, x) => gsap.fromTo(sel, { x: 0 }, { x, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  part('.hero [data-from="left"]', () => -window.innerWidth * 0.5);
  part('.hero [data-from="right"]', () => window.innerWidth * 0.5);
}

/* ---------- The stage: one chapter per screen of scroll ---------- */

const PI = Math.PI;
const pose = (o) => ({ x: 0.5, y: 0.5, s: 0.6, rx: -0.1, ry: 0, rz: 0, explode: 0, idle: 0.5, ...o });
const SWIPE = 2; // the chapter where the card swipes off one side and back in from the other

const DESK = {
  hero: pose({ s: 0.68, rx: -0.12, ry: -0.35, rz: 0.08, idle: 1 }),
  chapters: [
    { in: pose({ s: 0.62, ry: 0.4, rz: -0.04 }), hold: pose({ s: 0.62, ry: -0.35, rx: -0.16 }) },
    { in: pose({ s: 0.5, rx: -0.55, ry: -0.7, rz: 0.12, idle: 0.3 }), hold: pose({ s: 0.46, rx: -0.68, ry: -0.95, rz: 0.14, explode: 1, idle: 0.3 }) },
    { in: pose({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }), hold: pose({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }) },
    { in: pose({ s: 0.62, ry: 2.5 }), hold: pose({ s: 0.62, rx: -0.12, ry: PI + 0.15 }) },
    { in: pose({ s: 0.58, ry: PI * 2 - 0.2, idle: 0.8 }), hold: pose({ s: 0.58, ry: PI * 2 - 0.2, idle: 0.8 }) },
  ],
};
const PHONE = {
  hero: pose({ s: 0.48, rx: -0.12, ry: -0.35, rz: 0.08, idle: 1 }),
  chapters: [
    { in: pose({ s: 0.44, ry: 0.4, rz: -0.04 }), hold: pose({ s: 0.44, ry: -0.35, rx: -0.16 }) },
    { in: pose({ s: 0.38, rx: -0.55, ry: -0.7, rz: 0.12, idle: 0.3 }), hold: pose({ s: 0.34, rx: -0.68, ry: -0.95, rz: 0.14, explode: 1, idle: 0.3 }) },
    { in: pose({ s: 0.5, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }), hold: pose({ s: 0.5, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }) },
    { in: pose({ s: 0.44, ry: 2.5 }), hold: pose({ s: 0.44, rx: -0.12, ry: PI + 0.15 }) },
    { in: pose({ s: 0.32, y: 0.36, ry: PI * 2 - 0.2, idle: 0.8 }), hold: pose({ s: 0.32, y: 0.36, ry: PI * 2 - 0.2, idle: 0.8 }) },
  ],
};

const panels = gsap.utils.toArray('[data-panel]');
const words = panels.map((p) => p.querySelector('[data-drift]'));
gsap.set(panels, { autoAlpha: 0 });

// The first chapter arrives as the stage rises, once the card has cleared the way.
gsap.fromTo(panels[0], { autoAlpha: 0 }, {
  autoAlpha: 1,
  ease: 'none',
  immediateRender: false,
  scrollTrigger: { trigger: '#card', start: 'top 40%', end: 'top top', scrub },
});

const mm = gsap.matchMedia();
mm.add({ desk: '(min-width: 768px)', phone: '(max-width: 767.98px)' }, (ctx) => {
  const K = ctx.conditions.desk ? DESK : PHONE;
  const C = K.chapters;
  const last = C.length - 1;
  const target = card ? card.pose : {};
  const later = { immediateRender: false };

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#card', start: 'top top', end: 'bottom bottom', scrub },
  });

  C.forEach((c, i) => {
    // Each giant word slides sideways through its chapter; the swipe chapter's word travels furthest.
    const travel = i === SWIPE ? 40 : 10;
    tl.fromTo(words[i], { xPercent: travel }, { xPercent: -travel, ...later, duration: 1 }, i);

    if (i === SWIPE) {
      tl.fromTo(target, { x: 0.5 }, { x: 1.7, ...later, duration: 0.28, ease: 'power2.in' }, i + 0.08)
        .set(target, { x: -0.7 }, i + 0.37)
        .fromTo(target, { x: -0.7 }, { x: 0.5, ...later, duration: 0.3, ease: 'power3.out' }, i + 0.38);
    } else {
      tl.fromTo(target, { ...c.in }, { ...c.hold, ...later, duration: 0.7 }, i + 0.05);
    }
    if (i === last) return;
    tl.fromTo(target, { ...c.hold }, { ...C[i + 1].in, ...later, duration: 0.3 }, i + 0.75)
      .fromTo(panels[i], { autoAlpha: 1 }, { autoAlpha: 0, ...later, duration: 0.12 }, i + 0.8)
      .fromTo(panels[i + 1], { autoAlpha: 0 }, { autoAlpha: 1, ...later, duration: 0.12 }, i + 0.92);
  });
  tl.to({}, { duration: 0.05 }, C.length - 0.05);

  if (card) {
    Object.assign(card.pose, K.hero);
    gsap.fromTo(card.pose, { ...K.hero }, {
      ...C[0].in,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: '#card', start: 'top bottom', end: 'top top', scrub },
    });
  }
});

/* ---------- Marquee rows swipe in opposite directions ---------- */

gsap.utils.toArray('[data-marquee]').forEach((row) => {
  const forward = Number(row.dataset.marquee) > 0;
  gsap.fromTo(row, { xPercent: forward ? -25 : 0 }, {
    xPercent: forward ? 0 : -25,
    ease: 'none',
    scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true },
  });
});

/* ---------- Swipe reveals: a bar crosses, the words are left behind ---------- */

gsap.utils.toArray('[data-swipe]').forEach((el, n) => {
  const text = document.createElement('span');
  text.append(...el.childNodes);
  const bar = document.createElement('span');
  bar.className = 'swipe-bar';
  el.append(text, bar);
  if (reduce) return;
  gsap.set(text, { opacity: 0 });
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true }, delay: n * 0.12 })
    .to(bar, { scaleX: 1, duration: 0.45, ease: 'power3.inOut' })
    .set(text, { opacity: 1 })
    .set(bar, { transformOrigin: 'right' })
    .to(bar, { scaleX: 0, duration: 0.45, ease: 'power3.inOut' });
});

gsap.utils.toArray('[data-reveal]').forEach((group) => {
  gsap.from(group.children, {
    y: reduce ? 0 : 32,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.06,
    scrollTrigger: { trigger: group, start: 'top 85%', once: true },
  });
});

document.fonts.ready.then(() => {
  fitAll();
  ScrollTrigger.refresh();
});
window.addEventListener('resize', fitAll);
