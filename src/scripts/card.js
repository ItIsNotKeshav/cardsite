import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// ISO/IEC 7810 ID-1 card held upright (portrait), modelled in centimetres.
const W = 5.398;
const H = 8.56;
const R = 0.318;
const PLATE = 0.022;
const BEVEL = 0.006;
const CORE = 0.028;
const FACE_Z = CORE / 2 + PLATE + BEVEL * 2;
const CHIP = { x: -W / 2 + 1.2, y: H / 2 - 1.6 };
// A well-known public test number, so the card never shows a real account.
const NUMBER = ['4242', '4242', '4242', '4242'];

// Every finish is grade 5 titanium underneath; the edge is always anodised.
export const FINISHES = {
  silver: { plate: '#aaa59d', metalness: 1, roughness: 0.34, clearcoat: 0.05, anisotropy: 0.9, env: 1.5, core: '#3a3c40', etch: '#26282c', stripe: '#141517', etchMetal: 0.35, etchRough: 0.62 },
  black: { plate: '#2a2a2d', metalness: 0.9, roughness: 0.38, clearcoat: 0.2, anisotropy: 0.8, env: 2.2, core: '#09090a', etch: '#c3c6cc', stripe: '#050506', etchMetal: 0.9, etchRough: 0.3 },
  gold: { plate: '#f0cd78', metalness: 1, roughness: 0.3, clearcoat: 0.05, anisotropy: 0.85, env: 2.3, core: '#1c160c', etch: '#2a1d05', stripe: '#141009', etchMetal: 0.4, etchRough: 0.6 },
  white: { plate: '#f3f2ee', metalness: 0.02, roughness: 0.3, clearcoat: 1, anisotropy: 0.02, env: 1.0, core: '#d8d6d0', etch: '#1f2023', stripe: '#1a1b1d', etchMetal: 0.1, etchRough: 0.55 },
};

function cardShape(inset = 0) {
  const w = W - inset * 2;
  const h = H - inset * 2;
  const r = R - inset;
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

// Maps x/y in card centimetres to 0..1 so canvas artwork lands where it was drawn.
function cardUVs(geometry) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5);
  uv.needsUpdate = true;
  return geometry;
}

function slab(depth, bevel, inset = 0) {
  const g = new THREE.ExtrudeGeometry(cardShape(inset), {
    depth,
    curveSegments: 24,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  g.translate(0, 0, -depth / 2);
  return cardUVs(g);
}

// Brushed titanium: fine lines running the length of the card, each a slightly different roughness.
function brushCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const k = size / 1024;
  g.fillStyle = '#c4c4c4';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000 * k; i++) {
    const v = (170 + Math.random() * 75) | 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.16})`;
    g.fillRect(Math.random() * size, (Math.random() * 1224 - 200) * k, Math.random() < 0.85 ? 1 : 2, (200 + Math.random() * 800) * k);
  }
  return c;
}

// A dark studio with tall strip lights: what the card reflects, so the brushing shows as long streaks.
function studio() {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x4a4a4e, side: THREE.BackSide })));
  const strip = (x, y, z, w, h, power, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    m.material.color.setScalar(power);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    m.rotateZ(ry);
    room.add(m);
  };
  // In front of the card (where the camera is), so a face-on card catches them as it turns.
  strip(-7, 0, 15, 2.6, 30, 7);
  strip(8, 1, 14, 1.2, 30, 5);
  strip(0, 13, 11, 22, 4, 2.5);
  // Behind and to the sides, for the edge and the reverse.
  strip(-12, 0, -4, 2, 26, 4);
  strip(12, 0, -6, 1.5, 26, 4);
  return room;
}

// Contact pads, drawn upright to match the portrait card.
function chipCanvas() {
  const c = document.createElement('canvas');
  c.width = 392;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#7a5d27';
  g.lineWidth = 9;
  const cx = 196;
  const cy = 256;
  g.strokeRect(cx - 64, cy - 70, 128, 140);
  [-1, 1].forEach((side) => {
    const y0 = cy + side * 70;
    const y1 = side < 0 ? 0 : 512;
    [-64, 0, 64].forEach((dx) => {
      g.beginPath();
      g.moveTo(cx + dx, y0);
      g.lineTo(cx + dx, y1);
      g.stroke();
    });
  });
  g.beginPath();
  g.moveTo(0, cy);
  g.lineTo(cx - 64, cy);
  g.moveTo(cx + 64, cy);
  g.lineTo(392, cy);
  g.stroke();
  return c;
}

// Expanded lines are the display face (Archivo); everything else is set in Geist, like the page.
function setFont(g, weight, px, spacing, stretch = 'normal') {
  g.font = `${weight} ${px}px "${stretch === 'expanded' ? 'Archivo Variable' : 'Geist Variable'}", Arial, sans-serif`;
  g.fontStretch = stretch;
  g.letterSpacing = `${spacing}px`;
}

function drawFront(canvas, f, name) {
  const g = canvas.getContext('2d');
  const k = canvas.width / W;
  const top = (y) => (H / 2 - y) * k; // card y (cm, up) to canvas y
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = g.strokeStyle = f.etch;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';

  g.lineWidth = 0.065 * k;
  g.lineCap = 'round';
  const cx = (W / 2 + CHIP.x + 1.05) * k;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(cx, top(CHIP.y), (0.15 + i * 0.12) * k, -0.62, 0.62);
    g.stroke();
  }

  // A vertical line of type down the right edge.
  g.save();
  g.translate((W - 0.5) * k, 0.55 * k);
  g.rotate(Math.PI / 2);
  setFont(g, 700, 0.19 * k, 0.07 * k);
  g.fillText('TITANIUM  ·  HERMES PAY', 0, 0);
  g.restore();

  setFont(g, 800, 0.66 * k, 0.01 * k, 'expanded');
  g.fillText('HERMES', 0.5 * k, (H - 1.55) * k);
  setFont(g, 700, 0.2 * k, 0.16 * k);
  g.fillText('CARD', 0.52 * k, (H - 1.15) * k);

  setFont(g, 600, 0.27 * k, 0.05 * k);
  g.fillText(name, 0.5 * k, (H - 0.55) * k);
}

function drawBack(canvas, f, name) {
  const g = canvas.getContext('2d');
  const k = canvas.width / W;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = f.stripe;
  g.fillRect(0.5 * k, 0, 1.15 * k, canvas.height);

  g.fillStyle = f.etch;
  const x = 2.05 * k;
  setFont(g, 700, 0.17 * k, 0.05 * k);
  g.fillText('NOT A REAL CARD', x, 0.95 * k);

  setFont(g, 600, 0.52 * k, 0.03 * k);
  NUMBER.forEach((part, i) => g.fillText(part, x, (2.2 + i * 0.64) * k));

  setFont(g, 600, 0.19 * k, 0.04 * k);
  g.fillText('VALID THRU', x, 4.85 * k);
  g.fillText('CVC', x + 1.75 * k, 4.85 * k);
  setFont(g, 700, 0.3 * k, 0.04 * k);
  g.fillText('10/31', x, 5.25 * k);
  g.fillText('739', x + 1.75 * k, 5.25 * k);

  setFont(g, 600, 0.24 * k, 0.04 * k);
  g.fillText(name, x, (H - 0.55) * k);
}

// Frame-rate independent easing: the same feel at 60, 90 or 120 Hz.
const damp = (from, to, lambda, dt) => from + (to - from) * (1 - Math.exp(-lambda * dt));

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const IDENTITY = new THREE.Quaternion();

// pose and offset are owned by the page's scroll story; the card only reads them each frame.
export function createCard(canvas, { pose, offset }) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  // Resolution steps down if frames run long, so a slower phone keeps a steady frame rate instead of stuttering.
  const RATIOS = [2, 1.75, 1.5, 1.25, 1].filter((r) => r <= Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  if (!RATIOS.length) RATIOS.push(Math.min(window.devicePixelRatio, 1));
  let ratioStep = 0;
  renderer.setPixelRatio(RATIOS[0]);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.02).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-6, 9, 12);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(8, -4, -6);

  // A near-frontal light whose only job is to cast the floating card onto the page behind it.
  const caster = new THREE.DirectionalLight(0xffffff, 0.25);
  caster.position.set(-3, 5, 22);
  caster.castShadow = true;
  // The shadow is soft and far behind the card, so a small map loses nothing you can see.
  caster.shadow.mapSize.setScalar(small ? 512 : 1024);
  caster.shadow.radius = small ? 6 : 12;
  caster.shadow.blurSamples = small ? 8 : 16;
  caster.shadow.bias = -0.0005;
  Object.assign(caster.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 });
  scene.add(key, rim, caster);

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.25 })); // taste-skill-ignore: rendered light under a floating object
  catcher.position.z = -7;
  catcher.receiveShadow = true;
  scene.add(catcher);

  const camera = new THREE.PerspectiveCamera(28, 1, 5, 120);
  camera.position.set(0, 0, 34);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const brush = new THREE.CanvasTexture(brushCanvas(small ? 512 : 1024));
  brush.wrapS = brush.wrapT = THREE.RepeatWrapping;
  brush.repeat.set(1 / W, 1 / H);
  brush.offset.set(0.5, 0.5);
  brush.anisotropy = maxAniso;

  const plateMat = new THREE.MeshPhysicalMaterial({
    roughnessMap: brush,
    bumpMap: brush,
    bumpScale: 0.12,
    anisotropyRotation: Math.PI / 2, // stretch highlights along the brush lines
    clearcoatRoughness: 0.35,
  });
  const edgeMat = new THREE.MeshPhysicalMaterial({
    color: '#9aa0aa',
    metalness: 1,
    roughness: 0.22,
    iridescence: 1,
    iridescenceIOR: 2.3,
    iridescenceThicknessRange: [260, 620],
    envMapIntensity: 2.4,
  });
  const coreMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1 });

  const chipTex = new THREE.CanvasTexture(chipCanvas());
  chipTex.colorSpace = THREE.SRGBColorSpace;
  chipTex.anisotropy = maxAniso;
  const chipMat = new THREE.MeshPhysicalMaterial({ color: '#e8c77c', map: chipTex, metalness: 1, roughness: 0.28, clearcoat: 0.3 });

  const faceH = small ? 1536 : 2048;
  const faceW = Math.round((faceH * W) / H);
  const frontCanvas = Object.assign(document.createElement('canvas'), { width: faceW, height: faceH });
  const backCanvas = Object.assign(document.createElement('canvas'), { width: faceW, height: faceH });
  const etchTexture = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const frontTex = etchTexture(frontCanvas);
  const backTex = etchTexture(backCanvas);
  const etchMat = (map) =>
    new THREE.MeshPhysicalMaterial({
      map,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
  const frontEtch = etchMat(frontTex);
  const backEtch = etchMat(backTex);

  const plateGeo = slab(PLATE, BEVEL);
  const faceGeo = cardUVs(new THREE.ShapeGeometry(cardShape(0.02), 24));
  const plateMats = [plateMat, edgeMat]; // extrude groups: caps, sides

  // swivel carries the position and whatever turn your hand has given it; card inside it holds the story's pose.
  const swivel = new THREE.Group();
  const card = new THREE.Group();
  swivel.add(card);
  scene.add(swivel);

  const front = new THREE.Group();
  const frontPlate = new THREE.Mesh(plateGeo, plateMats);
  frontPlate.position.z = CORE / 2 + BEVEL + PLATE / 2;
  const frontFace = new THREE.Mesh(faceGeo, frontEtch);
  frontFace.position.z = FACE_Z + 0.0008;
  frontFace.renderOrder = 2;
  const chip = new THREE.Mesh(new RoundedBoxGeometry(0.88, 1.15, 0.03, 2, 0.09), chipMat);
  chip.position.set(CHIP.x, CHIP.y, FACE_Z - 0.012);
  front.add(frontPlate, frontFace, chip);

  const back = new THREE.Group();
  const backPlate = new THREE.Mesh(plateGeo, plateMats);
  backPlate.position.z = -(CORE / 2 + BEVEL + PLATE / 2);
  const backFace = new THREE.Mesh(faceGeo, backEtch);
  backFace.rotation.y = Math.PI;
  backFace.position.z = -FACE_Z - 0.0008;
  backFace.renderOrder = 2;
  back.add(backPlate, backFace);

  const core = new THREE.Mesh(slab(CORE, 0, 0.012), coreMat);
  card.add(back, core, front);
  [frontPlate, backPlate, core, chip].forEach((m) => { m.castShadow = true; });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

  /* ---------- Turning it by hand ----------
     Drag sideways to spin it, up and down to tip it over. The turn is kept as a quaternion so the
     two axes always follow your hand on screen; let go and it coasts, then settles back to its pose. */

  const turn = new THREE.Quaternion();
  const step = new THREE.Quaternion();
  const spin = { x: 0, y: 0 }; // angular velocity in radians per second, about the screen's x and y
  const drag = { on: false, x: 0, y: 0, t: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const RAD_PER_PX = 0.0085;

  function rotateBy(ax, ay) {
    if (ay) turn.premultiply(step.setFromAxisAngle(Y_AXIS, ay));
    if (ax) turn.premultiply(step.setFromAxisAngle(X_AXIS, ax));
  }

  function grab(x, y) {
    drag.on = true;
    drag.x = x;
    drag.y = y;
    drag.t = performance.now();
    spin.x = spin.y = 0;
    document.documentElement.classList.add('is-dragging');
  }
  function move(x, y) {
    if (!drag.on) return;
    const now = performance.now();
    const dt = Math.max((now - drag.t) / 1000, 1 / 240);
    const ay = (x - drag.x) * RAD_PER_PX;
    const ax = (y - drag.y) * RAD_PER_PX;
    rotateBy(ax, ay);
    // A smoothed velocity, so a flick carries on at the speed your hand was moving.
    spin.x = damp(spin.x, ax / dt, 24, dt);
    spin.y = damp(spin.y, ay / dt, 24, dt);
    drag.x = x;
    drag.y = y;
    drag.t = now;
  }
  function release() {
    if (!drag.on) return;
    drag.on = false;
    // A hand that stopped before letting go shouldn't flick it.
    if (performance.now() - drag.t > 80) spin.x = spin.y = 0;
    const cap = 18;
    spin.x = THREE.MathUtils.clamp(spin.x, -cap, cap);
    spin.y = THREE.MathUtils.clamp(spin.y, -cap, cap);
    document.documentElement.classList.remove('is-dragging');
  }

  // Is the point on screen over the card itself?
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hit(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(swivel, true).length > 0;
  }

  let active = true;
  const blocked = (target) => target.closest('a, button, input, label, summary, select, textarea, [data-no-drag], [data-curtain], .curtain, .nav, .menu');

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      move(e.clientX, e.clientY);
    }
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (!active || e.pointerType !== 'mouse' || e.button !== 0 || blocked(e.target)) return;
    grab(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') release(); });
  window.addEventListener('blur', release);

  // Touch: a sideways swipe on the card turns it straight away. A press and hold on the card frees it
  // to tip up and down too. A vertical swipe is left alone, so the page still scrolls under your thumb.
  const touch = { id: null, x0: 0, y0: 0, mode: null, timer: 0 };
  const HOLD_MS = 220;
  const SLOP = 8;
  function touchById(list) {
    for (const t of list) if (t.identifier === touch.id) return t;
    return null;
  }
  function endTouch() {
    clearTimeout(touch.timer);
    if (touch.mode === 'drag') release();
    touch.id = null;
    touch.mode = null;
    document.documentElement.classList.remove('is-holding');
  }
  window.addEventListener('touchstart', (e) => {
    if (touch.id !== null) { endTouch(); return; } // a second finger: pinch or scroll, not ours
    const t = e.changedTouches[0];
    if (!active || blocked(e.target) || !hit(t.clientX, t.clientY)) return;
    touch.id = t.identifier;
    touch.x0 = t.clientX;
    touch.y0 = t.clientY;
    touch.mode = 'pending';
    touch.timer = setTimeout(() => {
      if (touch.mode !== 'pending') return;
      touch.mode = 'drag';
      grab(touch.x0, touch.y0);
      document.documentElement.classList.add('is-holding');
      navigator.vibrate?.(8);
    }, HOLD_MS);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (touch.id === null) return;
    const t = touchById(e.changedTouches);
    if (!t) return;
    if (touch.mode === 'pending') {
      const dx = t.clientX - touch.x0;
      const dy = t.clientY - touch.y0;
      if (Math.hypot(dx, dy) < SLOP) return;
      clearTimeout(touch.timer);
      if (Math.abs(dx) > Math.abs(dy) * 1.2 && e.cancelable) {
        touch.mode = 'drag';
        grab(touch.x0, touch.y0);
      } else {
        touch.mode = 'scroll';
        return;
      }
    }
    if (touch.mode !== 'drag') return;
    if (e.cancelable) e.preventDefault();
    move(t.clientX, t.clientY);
  }, { passive: false });
  window.addEventListener('touchend', (e) => { if (touchById(e.changedTouches)) endTouch(); }, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });

  /* ---------- Finish and name ---------- */

  let finish = null;
  let name = 'YOUR NAME';
  let finishTween = null;

  function redraw() {
    const f = FINISHES[finish];
    drawFront(frontCanvas, f, name);
    drawBack(backCanvas, f, name);
    frontTex.needsUpdate = true;
    backTex.needsUpdate = true;
  }

  const colorA = new THREE.Color();
  const colorB = new THREE.Color();
  const lerp = (a, b, k) => a + (b - a) * k;

  function applyMaterials(from, to, k) {
    plateMat.color.copy(colorA.set(from.plate)).lerp(colorB.set(to.plate), k);
    coreMat.color.copy(colorA.set(from.core)).lerp(colorB.set(to.core), k);
    plateMat.metalness = lerp(from.metalness, to.metalness, k);
    plateMat.roughness = lerp(from.roughness, to.roughness, k);
    plateMat.clearcoat = lerp(from.clearcoat, to.clearcoat, k);
    plateMat.anisotropy = lerp(from.anisotropy, to.anisotropy, k);
    plateMat.envMapIntensity = lerp(from.env, to.env, k);
    for (const m of [frontEtch, backEtch]) {
      m.metalness = lerp(from.etchMetal, to.etchMetal, k);
      m.roughness = lerp(from.etchRough, to.etchRough, k);
    }
  }

  function setFinish(next, animate = true, gsap = null) {
    if (!FINISHES[next] || next === finish) return;
    const from = FINISHES[finish] || FINISHES[next];
    const to = FINISHES[next];
    finish = next;
    finishTween?.kill();
    if (!animate || !gsap) {
      offset.spin = 0;
      applyMaterials(from, to, 1);
      redraw();
      return;
    }
    // One full turn: the artwork is swapped while the card is edge-on.
    const progress = { k: 0 };
    let swapped = false;
    const startSpin = offset.spin % (Math.PI * 2);
    finishTween = gsap.to(progress, {
      k: 1,
      duration: motion ? 1.3 : 0.6,
      ease: 'expo.inOut',
      onUpdate() {
        applyMaterials(from, to, progress.k);
        if (motion) offset.spin = startSpin + progress.k * (Math.PI * 2 - startSpin);
        if (!swapped && progress.k >= (motion ? 0.25 : 0.5)) {
          swapped = true;
          redraw();
        }
      },
      onComplete() {
        offset.spin = 0;
      },
    });
  }

  function setName(next) {
    name = next || 'YOUR NAME';
    if (finish) redraw();
  }

  /* ---------- Size ---------- */

  // The canvas is as tall as the largest viewport (CSS: 100lvh), so a phone's toolbar
  // sliding in and out never resizes it mid-scroll.
  let size = { w: 0, h: 0 };
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === size.w && h === size.h) return;
    size = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let clock = 0;

  // Called once a frame from the page's ticker, after the scroll position has been updated.
  // Average frame time; when it stays over budget, drop a resolution step.
  const budget = { avg: 1 / 60, since: 0 };
  function adapt(rawDt) {
    budget.avg += (Math.min(rawDt, 0.1) - budget.avg) * 0.05;
    budget.since += rawDt;
    if (budget.since < 1.5 || budget.avg < 1 / 50 || ratioStep >= RATIOS.length - 1) return;
    ratioStep++;
    budget.since = 0;
    budget.avg = 1 / 60;
    renderer.setPixelRatio(RATIOS[ratioStep]);
    size = { w: 0, h: 0 };
    resize();
  }

  function tick(dt) {
    if (!active) return;
    // Hidden tabs and the first frames after loading aren't representative of the device.
    if (dt < 0.25 && clock > 1) adapt(dt);
    dt = Math.min(dt, 1 / 20); // a dropped frame shouldn't make it jump
    clock += dt;
    const t = clock;

    pointer.x = damp(pointer.x, pointer.tx, 3.5, dt);
    pointer.y = damp(pointer.y, pointer.ty, 3.5, dt);

    if (!drag.on) {
      // Coast, slowing down, then ease back to the pose by the shortest way round.
      const speed = Math.hypot(spin.x, spin.y);
      if (speed > 0.001) {
        rotateBy(spin.x * dt, spin.y * dt);
        const friction = Math.exp(-2.6 * dt);
        spin.x *= friction;
        spin.y *= friction;
      }
      const settle = 2.2 + 5 * Math.max(0, 1 - speed / 3); // pulls harder as it slows
      turn.slerp(IDENTITY, 1 - Math.exp(-settle * dt));
    }

    const vh = 2 * tanHalf * camera.position.z;
    const vw = vh * camera.aspect;
    const idle = pose.idle * motion;
    const follow = motion * (0.4 + pose.idle * 0.6);
    const e = pose.explode;

    swivel.position.set((pose.x - 0.5 + offset.x) * vw, (0.5 - pose.y - offset.y) * vh, 0);
    swivel.quaternion.copy(turn);
    // Sized by height, but never wider than most of a narrow screen.
    swivel.scale.setScalar(Math.min((pose.s * vh) / H, (0.78 * vw) / W) * offset.scale);
    card.rotation.set(
      pose.rx + offset.rx + Math.sin(t * 0.7) * 0.03 * idle + pointer.y * 0.28 * follow,
      pose.ry + offset.ry + offset.spin + Math.sin(t * 0.45) * 0.06 * idle + pointer.x * 0.42 * follow,
      pose.rz + offset.rz + Math.sin(t * 0.55) * 0.02 * idle,
    );

    front.position.set(e * 0.45, e * 0.5, e * 3.2);
    chip.position.z = FACE_Z - 0.012 + e * 2.2;
    back.position.set(-e * 0.45, -e * 0.5, -e * 3.2);

    renderer.render(scene, camera);
  }

  // Off while the card is hidden behind the content sections, so scrolling there costs no GPU time.
  function setActive(on) {
    if (on === active) return;
    active = on;
    if (!on) {
      release();
      endTouch();
      spin.x = spin.y = 0;
      turn.identity();
    }
  }

  const ready = Promise.all([
    document.fonts.load('600 40px "Geist Variable"'),
    document.fonts.load('700 40px "Geist Variable"'),
    document.fonts.load('800 40px "Archivo Variable"'),
  ])
    .catch(() => {})
    .then(() => {
      if (finish) redraw();
    });

  // Compile the shaders now rather than on the first frame they're needed.
  renderer.compile(scene, camera);

  return { setFinish, setName, tick, setActive, ready };
}
