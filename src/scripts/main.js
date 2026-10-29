import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initRewards } from './rewards.js';
import { initFaq } from './faq.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const scrub = reduce ? true : 1;

const BG = { black: '#ff4499', silver: '#0a0a0b', burgundy: '#f6c9d1', gold: '#3a74ff' };
const NOTE = {
  silver: 'Brushed titanium under a pearl-white glaze.',
  black: 'Black titanium with a diamond-like carbon coat.',
  gold: 'Titanium with a gold titanium-nitride coat.',
  burgundy: 'Titanium anodised deep burgundy, silver type.',
};

/* ---------- The card's state, owned here and read by the 3D scene every frame ---------- */

// s is the card's height as a share of the screen height.
const pose = { x: 0.5, y: 0.5, s: 0.66, rx: -0.12, ry: -0.35, rz: 0.1, explode: 0, idle: 1 };
// The card drops in from above when the scene is ready, so it starts out there.
const offset = reduce
  ? { x: 0, y: 0, rx: 0, ry: 0, rz: 0, spin: 0, scale: 1 }
  : { x: 0, y: -1.1, rx: 1.2, ry: Math.PI * 2, rz: 0, spin: 0, scale: 0.5 };

let card = null;
const canvas = document.getElementById('canvas');

/* ---------- Smooth scroll, and one ticker for scroll, tweens and the 3D frame ---------- */

let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
}
gsap.ticker.add((time, deltaMs) => {
  lenis?.raf(time * 1000);
  card?.tick(deltaMs / 1000);
});
gsap.ticker.lagSmoothing(0);

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
  document.querySelectorAll('[data-pick]').forEach((b) => {
    const mine = b.dataset.pick === name;
    b.setAttribute('aria-pressed', String(mine));
    b.textContent = mine ? 'Your finish' : `Choose ${b.dataset.pick}`;
  });
  themeMeta.content = BG[name];
  try { localStorage.setItem('heavy-metal-finish', name); } catch (e) { /* storage is a convenience only */ }
  card?.setFinish(name, animate, gsap);

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
    .to(wipe, { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'expo.inOut' })
    .add(swap)
    .to(wipe, { clipPath: 'inset(0 0 0 100%)', duration: 0.6, ease: 'expo.inOut' })
    .set(wipe, { visibility: 'hidden' });
}

document.querySelectorAll('[data-finish-btn]').forEach((b) => b.addEventListener('click', () => applyFinish(b.dataset.finishBtn)));
document.querySelectorAll('input[name="finish"]').forEach((i) => i.addEventListener('change', () => applyFinish(i.value)));
document.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => applyFinish(b.dataset.pick)));
document.querySelector('[data-chooser]').addEventListener('submit', (e) => e.preventDefault());

nameInput.addEventListener('input', () => {
  const clean = cleanName(nameInput.value);
  if (clean !== nameInput.value) nameInput.value = clean;
  card?.setName(clean.trim());
});

applyFinish(BG[root.dataset.finish] ? root.dataset.finish : 'black', false);

/* ---------- The 3D card loads after first paint, in its own chunk ---------- */

import('./card.js')
  .then(({ createCard }) => {
    card = createCard(canvas, { pose, offset });
    card.setFinish(root.dataset.finish, false);
    card.setName(cleanName(nameInput.value).trim());
    return card.ready;
  })
  .then(() => {
    root.classList.add('card-ready');
    if (!reduce) gsap.to(offset, { x: 0, y: 0, rx: 0, ry: 0, scale: 1, duration: 2, ease: 'expo.out' });
    ScrollTrigger.refresh();
  })
  .catch((err) => {
    card = null;
    root.classList.add('no-webgl');
    console.warn('Card scene unavailable:', err);
  });

/* ---------- Anchors scroll smoothly; the phone menu ---------- */

const menu = document.querySelector('[data-menu]');
const menuBtn = document.querySelector('[data-menu-btn]');
let menuTl = null;

function setMenu(open) {
  if (open === (menuBtn.getAttribute('aria-expanded') === 'true')) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  root.classList.toggle('menu-open', open);
  menuTl?.kill();
  if (open) {
    menu.hidden = false;
    lenis?.stop();
    menuTl = gsap.timeline()
      .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0 : 0.6, ease: 'expo.out' })
      .fromTo(menu.querySelectorAll('a'), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' }, 0.1);
  } else {
    lenis?.start();
    menuTl = gsap.timeline({ onComplete: () => { menu.hidden = true; } })
      .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: reduce ? 0 : 0.45, ease: 'expo.inOut' });
  }
}
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

function scrollToHash(id) {
  const target = id === '#top' ? 0 : document.querySelector(id);
  if (target === null) return false;
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
  else if (target === 0) window.scrollTo({ top: 0 });
  else target.scrollIntoView();
  history.replaceState(null, '', id);
  return true;
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  e.preventDefault();
  setMenu(false);
  scrollToHash(id);
});

/* ---------- The cursor dot the card follows ---------- */

const cursor = document.querySelector('[data-cursor]');
if (finePointer && !reduce) {
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    cursor.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
    cursor.classList.toggle('is-big', Boolean(e.target.closest('a, button, label, input, summary')));
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('a, button, label, input, summary, .curtain')) cursor.classList.add('is-drag');
  });
  window.addEventListener('pointerup', () => cursor.classList.remove('is-drag'));
  root.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
} else {
  cursor.remove();
  root.classList.add('no-cursor');
}

/* ---------- Giant words fill the width, within a height cap ---------- */

// Measured against the large viewport, so a phone's toolbar showing and hiding never resizes them.
const capHeight = () => Math.max(window.innerHeight, document.documentElement.clientHeight);
function fitAll() {
  const h = capHeight();
  document.querySelectorAll('[data-fit]').forEach((span) => {
    const box = span.parentElement;
    box.style.fontSize = '100px';
    const fit = (100 * box.clientWidth) / span.getBoundingClientRect().width;
    const cap = Number(span.dataset.fit) * h;
    box.style.fontSize = `${Math.min(fit, cap)}px`;
  });
}
fitAll();
let fitWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === fitWidth) return;
  fitWidth = window.innerWidth;
  fitAll();
});

/* ---------- Hero: the words swipe in from both sides, the card drops between them ---------- */

const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
if (reduce) {
  intro.from('.hero .giant-line > span, .hero [data-intro]', { opacity: 0, duration: 0.6 });
} else {
  intro.from('.hero [data-from="left"] > span', { xPercent: -110, duration: 1.5 }, 0.1)
    .from('.hero [data-from="right"] > span', { xPercent: 110, duration: 1.5 }, 0.18)
    .from('.hero [data-intro]', { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 0.7);

  // Leaving the hero, the two words part like a swipe.
  const part = (sel, x) => gsap.fromTo(sel, { x: 0 }, { x, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  part('.hero [data-from="left"]', () => -window.innerWidth * 0.5);
  part('.hero [data-from="right"]', () => window.innerWidth * 0.5);
}

// The intro line and buttons fade as the hero leaves, so they never pass under the card.
gsap.fromTo('.hero', { '--fade': 1 }, {
  '--fade': 0,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% top', scrub: true },
});

/* ---------- The stage: one chapter per screen of scroll ---------- */

const PI = Math.PI;
const at = (o) => ({ x: 0.5, y: 0.5, s: 0.6, rx: -0.1, ry: 0, rz: 0, explode: 0, idle: 0.5, ...o });
const SWIPE = 2; // the chapter where the card swipes off one side and back in from the other

const DESK = {
  hero: at({ s: 0.68, rx: -0.12, ry: -0.35, rz: 0.08, idle: 1 }),
  show: at({ s: 0.6, rx: -0.1, ry: PI * 2 - 0.3, rz: 0.04, idle: 0.9 }),
  chapters: [
    { in: at({ s: 0.62, ry: 0.4, rz: -0.04 }), hold: at({ s: 0.62, ry: -0.35, rx: -0.16 }) },
    { in: at({ s: 0.5, rx: -0.55, ry: -0.7, rz: 0.12, idle: 0.3 }), hold: at({ s: 0.46, rx: -0.68, ry: -0.95, rz: 0.14, explode: 1, idle: 0.3 }) },
    { in: at({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }), hold: at({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }) },
    { in: at({ s: 0.62, ry: 2.5 }), hold: at({ s: 0.62, rx: -0.12, ry: PI + 0.15 }) },
    { in: at({ s: 0.58, ry: PI * 2 - 0.2, idle: 0.8 }), hold: at({ s: 0.58, ry: PI * 2 - 0.2, idle: 0.8 }) },
  ],
};
const PHONE = {
  hero: at({ s: 0.46, rx: -0.12, ry: -0.35, rz: 0.08, idle: 1 }),
  show: at({ s: 0.44, rx: -0.1, ry: PI * 2 - 0.3, rz: 0.04, idle: 0.9 }),
  chapters: [
    { in: at({ s: 0.42, ry: 0.4, rz: -0.04 }), hold: at({ s: 0.42, ry: -0.35, rx: -0.16 }) },
    { in: at({ s: 0.36, rx: -0.55, ry: -0.7, rz: 0.12, idle: 0.3 }), hold: at({ s: 0.32, rx: -0.68, ry: -0.95, rz: 0.14, explode: 1, idle: 0.3 }) },
    { in: at({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }), hold: at({ s: 0.48, rx: -0.18, ry: 0.12, rz: PI / 2, idle: 0.2 }) },
    { in: at({ s: 0.42, ry: 2.5 }), hold: at({ s: 0.42, rx: -0.12, ry: PI + 0.15 }) },
    { in: at({ s: 0.3, y: 0.4, ry: PI * 2 - 0.2, idle: 0.8 }), hold: at({ s: 0.3, y: 0.4, ry: PI * 2 - 0.2, idle: 0.8 }) },
  ],
};

const panels = gsap.utils.toArray('[data-panel]');
const words = panels.map((p) => p.querySelector('[data-drift]'));
const corners = panels.map((p) => p.querySelectorAll('[data-corner]'));
// The stage timeline alone owns each panel's visibility; only the first starts shown.
gsap.set(panels, { autoAlpha: 0 });
gsap.set(panels[0], { autoAlpha: 1 });

// The first chapter's words arrive as the stage rises, once the card has cleared the way.
// This fades the panel's contents, not the panel, so it never fights the timeline.
gsap.fromTo(panels[0].children, { opacity: 0 }, {
  opacity: 1,
  ease: 'none',
  immediateRender: true,
  scrollTrigger: { trigger: '#card', start: 'top 40%', end: 'top top', scrub },
});

const mm = gsap.matchMedia();
mm.add({ desk: '(min-width: 768px)', phone: '(max-width: 767.98px)' }, (ctx) => {
  const K = ctx.conditions.desk ? DESK : PHONE;
  const C = K.chapters;
  const last = C.length - 1;
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
      tl.fromTo(pose, { x: 0.5 }, { x: 1.7, ...later, duration: 0.28, ease: 'power2.in' }, i + 0.08)
        .set(pose, { x: -0.7 }, i + 0.37)
        .fromTo(pose, { x: -0.7 }, { x: 0.5, ...later, duration: 0.3, ease: 'power3.out' }, i + 0.38);
    } else {
      tl.fromTo(pose, { ...c.in }, { ...c.hold, ...later, duration: 0.7, ease: 'sine.inOut' }, i + 0.05);
    }
    if (i === last) return;
    // Between chapters: the card moves on while the two chapters cross-fade over a long stretch of
    // scroll, so no flick of the thumb ever jumps from one to the other. The old words lift away,
    // the new ones rise into place a beat behind.
    tl.fromTo(pose, { ...c.hold }, { ...C[i + 1].in, ...later, duration: 0.3, ease: 'sine.inOut' }, i + 0.75)
      .fromTo(corners[i], { y: 0 }, { y: -40, ...later, duration: 0.24, ease: 'sine.in', stagger: 0.02 }, i + 0.7)
      .fromTo(panels[i], { autoAlpha: 1 }, { autoAlpha: 0, ...later, duration: 0.22, ease: 'sine.inOut' }, i + 0.72)
      .fromTo(panels[i + 1], { autoAlpha: 0 }, { autoAlpha: 1, ...later, duration: 0.24, ease: 'sine.inOut' }, i + 0.84)
      .fromTo(corners[i + 1], { y: 48 }, { y: 0, ...later, duration: 0.3, ease: 'power2.out', stagger: 0.03 }, i + 0.84);
  });
  tl.to({}, { duration: 0.05 }, C.length - 0.05);

  // Into the finish sections: the card settles in the middle, then turns slowly through them.
  gsap.fromTo(pose, { ...C[last].hold }, {
    ...K.show,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'top top', scrub },
  });
  gsap.fromTo(pose, { ry: K.show.ry }, {
    ry: K.show.ry + 0.7,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: { trigger: '.showcase', start: 'top top', end: 'bottom bottom', scrub },
  });

  Object.assign(pose, K.hero);
  gsap.fromTo(pose, { ...K.hero }, {
    ...C[0].in,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: { trigger: '#card', start: 'top bottom', end: 'top top', scrub },
  });
});

/* ---------- Every finish: the card previews each one as its screen arrives ---------- */

gsap.utils.toArray('[data-show]').forEach((panel) => {
  ScrollTrigger.create({
    trigger: panel,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) card?.setFinish(panel.dataset.show, true, gsap); },
  });
  const word = panel.querySelector('[data-show-word]');
  gsap.fromTo(word, { xPercent: 18 }, {
    xPercent: -18,
    ease: 'none',
    scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });
});
// Leaving the sections in either direction, the card returns to the finish you chose.
ScrollTrigger.create({
  trigger: '.showcase',
  start: 'top 55%',
  end: 'bottom 55%',
  onLeave: () => card?.setFinish(root.dataset.finish, true, gsap),
  onLeaveBack: () => card?.setFinish(root.dataset.finish, true, gsap),
});

// Once the content sections cover the screen the card can't be seen, so it stops drawing.
ScrollTrigger.create({
  trigger: '.marquee',
  start: 'top top',
  endTrigger: 'html',
  end: 'bottom bottom',
  onToggle: (self) => {
    card?.setActive(!self.isActive);
    canvas.style.visibility = self.isActive ? 'hidden' : '';
  },
});

/* ---------- Marquee rows swipe in opposite directions ---------- */

gsap.utils.toArray('[data-marquee]').forEach((row) => {
  const forward = Number(row.dataset.marquee) > 0;
  gsap.fromTo(row, { xPercent: forward ? -25 : 0 }, {
    xPercent: forward ? 0 : -25,
    ease: 'none',
    scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });
});

/* ---------- Swipe reveals: a bar crosses, the words are left behind ---------- */

gsap.utils.toArray('[data-swipe]').forEach((el) => {
  const text = document.createElement('span');
  text.append(...el.childNodes);
  const bar = document.createElement('span');
  bar.className = 'swipe-bar';
  el.append(text, bar);
  if (reduce) return;
  gsap.set(text, { opacity: 0 });
  gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
    .to(bar, { scaleX: 1, duration: 0.5, ease: 'expo.inOut' })
    .set(text, { opacity: 1 })
    .set(bar, { transformOrigin: 'right' })
    .to(bar, { scaleX: 0, duration: 0.5, ease: 'expo.inOut' });
});

/* ---------- Content rises into place as it arrives ---------- */

if (!reduce) {
  gsap.set('[data-reveal-1], [data-reveal] > *', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal-1], [data-reveal] > *', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => {
      // A jump down the page (a nav link) passes everything at once: what's already above the screen
      // just appears, and what's on screen rises together rather than queueing behind it.
      const passed = els.filter((el) => el.getBoundingClientRect().bottom < 0);
      const shown = els.filter((el) => !passed.includes(el));
      gsap.set(passed, { y: 0, opacity: 1, overwrite: true });
      gsap.to(shown, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: Math.min(0.06, 0.5 / shown.length), overwrite: true });
    },
  });
}

initRewards({ gsap, reduce, scrollTo: scrollToHash });
initFaq({ gsap, reduce });

document.fonts.ready.then(() => {
  fitAll();
  ScrollTrigger.refresh();
});
