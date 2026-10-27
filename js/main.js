import { createCard } from './card.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FIELD = { silver: '#ff4499', black: '#ddee55', gold: '#1d5cff', white: '#0f1112' };
const LABEL = { silver: 'Silver', black: 'Black', gold: 'Gold', white: 'White' };
const scrub = reduce ? true : 1;

let card = null;
try {
  card = createCard(document.getElementById('canvas'));
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
  const subject = `Obverse Ti request: ${finish}`;
  const body = `Hello,\n\nI would like to request an Obverse Ti card.\n\nFinish: ${finish}\nName on the card: ${name}\n\nThank you.`;
  requestLink.href = `mailto:hello@obverse.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function applyFinish(name, animate = true) {
  root.dataset.finish = name;
  document.querySelectorAll('[data-finish-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finishBtn === name)));
  document.querySelectorAll('input[name="finish"]').forEach((i) => { i.checked = i.value === name; });
  themeMeta.content = FIELD[name];
  card?.setFinish(name, animate);
  try { localStorage.setItem('obverse-ti-finish', name); } catch (e) { /* storage is a convenience only */ }
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
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else if (target === 0) window.scrollTo({ top: 0 });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
  });
});

/* ---------- Words that fill the width exactly ---------- */

function fitAll() {
  document.querySelectorAll('[data-fit]').forEach((span) => {
    const box = span.parentElement;
    box.style.fontSize = '100px';
    box.style.fontSize = `${(100 * box.clientWidth) / span.getBoundingClientRect().width}px`;
  });
}

/* ---------- Navigation turns solid once the hero has gone ---------- */

const nav = document.querySelector('[data-nav]');
ScrollTrigger.create({
  trigger: '.hero',
  start: () => `bottom top+=${nav.offsetHeight}`,
  onEnter: () => nav.classList.add('is-solid'),
  onLeaveBack: () => nav.classList.remove('is-solid'),
});

/* ---------- Hero entrance ---------- */

const heroWord = document.querySelector('.hero-word [data-fit]');
const word = heroWord.textContent.trim();
heroWord.textContent = '';
heroWord.setAttribute('aria-label', word);
for (const ch of word) {
  const s = document.createElement('span');
  s.className = 'char';
  s.textContent = ch;
  s.setAttribute('aria-hidden', 'true');
  heroWord.append(s);
}

const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
if (reduce) {
  intro.from('.hero .char, .hero [data-intro]', { opacity: 0, duration: 0.6 });
} else {
  intro.from('.hero .char', { yPercent: 105, duration: 1.3, stagger: 0.05 }, 0.1)
    .from('.hero [data-intro]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.6);
  if (card) intro.from(card.offset, { y: -0.9, rx: -1.1, ry: Math.PI * 1.5, scale: 0.6, duration: 2.2, ease: 'expo.out' }, 0);
}

/* ---------- The timeline runs sideways ---------- */

const track = document.querySelector('[data-track]');
const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
const sideways = gsap.to(track, {
  x: () => -distance(),
  ease: 'none',
  scrollTrigger: {
    trigger: '#story',
    start: 'top top',
    end: () => `+=${distance()}`,
    pin: true,
    scrub: reduce ? true : 0.6,
    invalidateOnRefresh: true,
  },
});

if (!reduce) {
  gsap.utils.toArray('.tl-figure img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.18, xPercent: -5 }, {
      scale: 1.02,
      xPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, containerAnimation: sideways, start: 'left right', end: 'right left', scrub: true },
    });
  });
}

/* ---------- The stage: the card holds the centre while chapters turn ---------- */

const PI = Math.PI;
const pose = (o) => ({ x: 0.5, y: 0.52, s: 0.44, rx: -0.12, ry: 0, rz: 0, explode: 0, idle: 0.5, ...o });

const DESK = {
  hero: pose({ y: 0.57, s: 0.5, rx: -0.3, ry: -0.3, rz: 0.12, idle: 1 }),
  chapters: [
    { in: pose({ y: 0.55, s: 0.4, ry: 0.3, rz: -0.06 }), hold: pose({ y: 0.55, s: 0.4, ry: -0.22, rx: -0.2, rz: -0.02 }) },
    { in: pose({ s: 0.36, rx: -0.7, ry: -0.62, rz: 0.16, idle: 0.3 }), hold: pose({ s: 0.34, rx: -0.8, ry: -0.8, rz: 0.18, explode: 1, idle: 0.3 }) },
    { in: pose({ x: 0.58, s: 0.56, rx: -0.08, ry: 1.05, rz: 0.06, idle: 0.3 }), hold: pose({ x: 0.58, y: 0.56, s: 0.6, rx: -0.26, ry: 1.46, rz: 0.1, idle: 0.3 }) },
    { in: pose({ s: 0.46, rx: -0.12, ry: 2.55 }), hold: pose({ s: 0.46, rx: -0.1, ry: PI + 0.14 }) },
    { in: pose({ x: 0.69, s: 0.4, rx: -0.1, ry: PI * 2 - 0.25, rz: 0.03, idle: 0.8 }), hold: pose({ x: 0.69, s: 0.4, rx: -0.1, ry: PI * 2 - 0.25, rz: 0.03, idle: 0.8 }) },
  ],
};
const PHONE = {
  hero: pose({ y: 0.6, s: 0.94, rx: -0.25, ry: -0.38, rz: 0.2, idle: 1 }),
  chapters: [
    { in: pose({ y: 0.46, s: 0.86, ry: 0.3, rz: -0.06 }), hold: pose({ y: 0.46, s: 0.86, ry: -0.22, rx: -0.2 }) },
    { in: pose({ y: 0.45, s: 0.72, rx: -0.7, ry: -0.62, rz: 0.16, idle: 0.3 }), hold: pose({ y: 0.44, s: 0.62, rx: -0.8, ry: -0.8, rz: 0.18, explode: 1, idle: 0.3 }) },
    { in: pose({ y: 0.46, s: 1.0, rx: -0.08, ry: 1.05, idle: 0.3 }), hold: pose({ y: 0.46, s: 1.1, rx: -0.26, ry: 1.46, rz: 0.1, idle: 0.3 }) },
    { in: pose({ y: 0.46, s: 0.86, ry: 2.55 }), hold: pose({ y: 0.46, s: 0.86, ry: PI + 0.14 }) },
    { in: pose({ y: 0.27, s: 0.74, ry: PI * 2 - 0.25, rz: 0.03, idle: 0.8 }), hold: pose({ y: 0.27, s: 0.74, ry: PI * 2 - 0.25, rz: 0.03, idle: 0.8 }) },
  ],
};

const panels = gsap.utils.toArray('[data-panel]');
const rails = gsap.utils.toArray('[data-rail]');
const setRail = (i) => rails.forEach((r, n) => r.classList.toggle('is-on', n === i));
gsap.set(panels, { autoAlpha: 0 });
setRail(0);
// The first chapter's words arrive only once the card has cleared the way.
gsap.fromTo(panels[0], { autoAlpha: 0, y: 28 }, {
  autoAlpha: 1,
  y: 0,
  ease: 'power2.out',
  immediateRender: false,
  scrollTrigger: { trigger: '#card', start: 'top 35%', end: 'top top', scrub },
});

const mm = gsap.matchMedia();
mm.add({ desk: '(min-width: 768px)', phone: '(max-width: 767.98px)' }, (ctx) => {
  const K = ctx.conditions.desk ? DESK : PHONE;
  const C = K.chapters;
  const last = C.length - 1;
  const from = { immediateRender: false };

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '#card',
      start: 'top top',
      end: 'bottom bottom',
      scrub,
      onUpdate: (self) => setRail(Math.min(last, Math.floor(self.progress * C.length + 0.1))),
    },
  });

  C.forEach((c, i) => {
    tl.fromTo(card?.pose ?? {}, { ...c.in }, { ...c.hold, ...from, duration: 0.7 }, i + 0.05);
    if (i === last) return;
    tl.fromTo(card?.pose ?? {}, { ...c.hold }, { ...C[i + 1].in, ...from, duration: 0.3 }, i + 0.75)
      .fromTo(panels[i], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -28, ...from, duration: 0.14 }, i + 0.76)
      .fromTo(panels[i + 1], { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, ...from, duration: 0.14, ease: 'power2.out' }, i + 0.9);
  });
  tl.to({}, { duration: 0.05 }, C.length - 0.05);

  if (card) {
    Object.assign(card.pose, K.hero);
    // The card settles into the first chapter while the stage rises into view.
    gsap.fromTo(card.pose, { ...K.hero }, {
      ...C[0].in,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: '#card', start: 'top bottom', end: 'top top', scrub },
    });
  }
});

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

document.fonts.ready.then(() => {
  fitAll();
  ScrollTrigger.refresh();
});
window.addEventListener('resize', fitAll);
