import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
function brushCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#c4c4c4';
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9000; i++) {
    const v = (170 + Math.random() * 75) | 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.16})`;
    g.fillRect(Math.random() * 1024, Math.random() * 1224 - 200, Math.random() < 0.85 ? 1 : 2, 200 + Math.random() * 800);
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
  g.font = `${weight} ${px}px "${stretch === 'expanded' ? 'Archivo' : 'Geist'}", Arial, sans-serif`;
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

export function createCard(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  caster.shadow.mapSize.set(2048, 2048);
  caster.shadow.radius = 18;
  caster.shadow.blurSamples = 24;
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

  const brush = new THREE.CanvasTexture(brushCanvas());
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

  const faceW = Math.round((2048 * W) / H);
  const frontCanvas = Object.assign(document.createElement('canvas'), { width: faceW, height: 2048 });
  const backCanvas = Object.assign(document.createElement('canvas'), { width: faceW, height: 2048 });
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

  const card = new THREE.Group();
  scene.add(card);

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

  // Driven from outside: pose by the scroll story, offset by intros and the finish spin.
  // s is the card's height as a share of the screen height.
  const pose = { x: 0.5, y: 0.5, s: 0.66, rx: -0.12, ry: -0.35, rz: 0.1, explode: 0, idle: 1 };
  const offset = { x: 0, y: 0, rx: 0, ry: 0, rz: 0, spin: 0, scale: 1 };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

  // The card turns toward the cursor, and can be flicked round by dragging.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { on: false, lastX: 0, v: 0, spin: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    if (drag.on) {
      drag.v = (e.clientX - drag.lastX) * 0.012;
      drag.spin += drag.v;
      drag.lastX = e.clientX;
    }
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('a, button, input, label, summary, [data-no-drag]')) return;
    drag.on = true;
    drag.lastX = e.clientX;
    drag.v = 0;
    document.documentElement.classList.add('is-dragging');
  });
  window.addEventListener('pointerup', () => {
    drag.on = false;
    document.documentElement.classList.remove('is-dragging');
  });

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

  function setFinish(next, animate = true) {
    if (!FINISHES[next] || next === finish) return;
    const from = FINISHES[finish] || FINISHES[next];
    const to = FINISHES[next];
    finish = next;
    finishTween?.kill();
    if (!animate || !window.gsap) {
      offset.spin = 0;
      applyMaterials(from, to, 1);
      redraw();
      return;
    }
    // One full turn: the artwork is swapped while the card is edge-on.
    const progress = { k: 0 };
    let swapped = false;
    const startSpin = offset.spin % (Math.PI * 2);
    finishTween = window.gsap.to(progress, {
      k: 1,
      duration: motion ? 1.2 : 0.6,
      ease: 'power3.inOut',
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

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  renderer.setAnimationLoop((time) => {
    const t = time / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    if (!drag.on) {
      drag.spin += drag.v;
      drag.v *= 0.93;
      drag.spin *= 0.95; // settles back to its pose
    }
    const vh = 2 * tanHalf * camera.position.z;
    const vw = vh * camera.aspect;
    const idle = pose.idle * motion;
    const follow = motion * (0.4 + pose.idle * 0.6);
    const e = pose.explode;

    card.position.set((pose.x - 0.5 + offset.x) * vw, (0.5 - pose.y - offset.y) * vh, 0);
    // Sized by height, but never wider than most of a narrow screen.
    card.scale.setScalar(Math.min((pose.s * vh) / H, (0.78 * vw) / W) * offset.scale);
    card.rotation.set(
      pose.rx + offset.rx + Math.sin(t * 0.7) * 0.03 * idle + pointer.y * 0.28 * follow,
      pose.ry + offset.ry + offset.spin + drag.spin + Math.sin(t * 0.45) * 0.06 * idle + pointer.x * 0.42 * follow,
      pose.rz + offset.rz + Math.sin(t * 0.55) * 0.02 * idle,
    );

    front.position.set(e * 0.45, e * 0.5, e * 3.2);
    chip.position.z = FACE_Z - 0.012 + e * 2.2;
    back.position.set(-e * 0.45, -e * 0.5, -e * 3.2);

    renderer.render(scene, camera);
  });

  const ready = Promise.all([
    document.fonts.load('600 40px "Geist"'),
    document.fonts.load('700 40px "Geist"'),
    document.fonts.load('800 40px "Archivo"'),
  ])
    .catch(() => {})
    .then(() => {
      if (finish) redraw();
    });

  return { pose, offset, setFinish, setName, ready };
}
