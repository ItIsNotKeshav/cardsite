import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ISO/IEC 7810 ID-1 card, modelled in centimetres.
const W = 8.56;
const H = 5.398;
const R = 0.318;
const PLATE = 0.022;
const BEVEL = 0.006;
const CORE = 0.028;
const FACE_Z = CORE / 2 + PLATE + BEVEL * 2;
const NUMBER = '4965  9628  1991  4096';

// Every finish is grade 5 titanium underneath; the edge is always anodised.
export const FINISHES = {
  silver: { plate: '#a19f9b', metalness: 1, roughness: 0.44, clearcoat: 0.08, anisotropy: 0.25, env: 1.25, core: '#3a3c40', etch: '#2a2c30', stripe: '#141517', etchMetal: 0.35, etchRough: 0.62 },
  black: { plate: '#232326', metalness: 0.85, roughness: 0.55, clearcoat: 0.35, anisotropy: 0.15, env: 2.0, core: '#09090a', etch: '#b9bcc2', stripe: '#050506', etchMetal: 0.9, etchRough: 0.3 },
  gold: { plate: '#d9b25a', metalness: 1, roughness: 0.34, clearcoat: 0.1, anisotropy: 0.2, env: 1.2, core: '#1c160c', etch: '#4f370f', stripe: '#141009', etchMetal: 0.4, etchRough: 0.6 },
  white: { plate: '#f3f2ee', metalness: 0.02, roughness: 0.32, clearcoat: 1, anisotropy: 0.02, env: 1.0, core: '#d8d6d0', etch: '#1f2023', stripe: '#1a1b1d', etchMetal: 0.1, etchRough: 0.55 },
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

// Bead-blasted titanium: a fine, even grain rather than brush lines.
function grainCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  const img = g.createImageData(1024, 1024);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 175 + Math.random() * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 1400; i++) {
    const v = (190 + Math.random() * 60) | 0;
    g.fillStyle = `rgba(${v},${v},${v},${0.08 + Math.random() * 0.12})`;
    g.fillRect(Math.random() * 1224 - 200, Math.random() * 1024, 200 + Math.random() * 700, 1);
  }
  return c;
}

function chipCanvas() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 392;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#7a5d27';
  g.lineWidth = 9;
  g.lineJoin = 'round';
  const cx = 256;
  const cy = 196;
  g.strokeRect(cx - 70, cy - 64, 140, 128);
  [-1, 1].forEach((side) => {
    const x0 = cx + side * 70;
    const x1 = side < 0 ? 0 : 512;
    [-64, 0, 64].forEach((dy) => {
      g.beginPath();
      g.moveTo(x0, cy + dy);
      g.lineTo(x1, cy + dy);
      g.stroke();
    });
  });
  g.beginPath();
  g.moveTo(cx, 0);
  g.lineTo(cx, cy - 64);
  g.moveTo(cx, cy + 64);
  g.lineTo(cx, 392);
  g.stroke();
  return c;
}

function setFont(g, weight, px, spacing, family = 'Barlow') {
  g.font = `${weight} ${px}px "${family}", Arial, sans-serif`;
  g.letterSpacing = `${spacing}px`;
}

// The mark: titanium's tile from the periodic table, laser-etched.
function tile(g, x, y, size) {
  g.lineWidth = size * 0.06;
  g.strokeRect(x, y, size, size);
  g.textAlign = 'left';
  setFont(g, 600, size * 0.2, 0);
  g.fillText('22', x + size * 0.12, y + size * 0.28);
  g.textAlign = 'center';
  setFont(g, 700, size * 0.56, 0, 'Barlow Condensed');
  g.fillText('Ti', x + size * 0.5, y + size * 0.84);
  g.textAlign = 'left';
}

function drawFront(canvas, f, name) {
  const g = canvas.getContext('2d');
  const k = canvas.width / W;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = g.strokeStyle = f.etch;
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';

  setFont(g, 700, 0.5 * k, 0.03 * k, 'Barlow Condensed');
  g.fillText('OBVERSE', 0.62 * k, 1.02 * k);

  g.lineWidth = 0.07 * k;
  g.lineCap = 'round';
  const cy = (H / 2 - 0.35) * k;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(2.62 * k, cy, (0.16 + i * 0.13) * k, -0.62, 0.62);
    g.stroke();
  }

  setFont(g, 600, 0.32 * k, 0.05 * k);
  g.fillText(name, 0.62 * k, (H - 0.62) * k);
  tile(g, (W - 1.52) * k, (H - 1.52) * k, 0.9 * k);
}

function drawBack(canvas, f, name) {
  const g = canvas.getContext('2d');
  const k = canvas.width / W;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.textBaseline = 'alphabetic';
  g.fillStyle = f.stripe;
  g.fillRect(0, 0.56 * k, canvas.width, 1.27 * k);

  g.fillStyle = g.strokeStyle = f.etch;
  g.textAlign = 'right';
  setFont(g, 600, 0.17 * k, 0.03 * k);
  g.fillText('GRADE 5 TITANIUM  ·  15 G  ·  ISSUED TO THE NAME BELOW', (W - 0.62) * k, 2.3 * k);
  g.textAlign = 'left';

  setFont(g, 500, 0.5 * k, 0.05 * k, 'Barlow Condensed');
  g.fillText(NUMBER, 0.62 * k, 3.1 * k);
  setFont(g, 500, 0.2 * k, 0.03 * k);
  g.fillText('VALID THRU  10/31', 0.62 * k, 3.62 * k);
  g.fillText('SECURITY CODE  739', 3.4 * k, 3.62 * k);

  setFont(g, 600, 0.3 * k, 0.05 * k);
  g.fillText(name, 0.62 * k, (H - 0.62) * k);
  tile(g, (W - 1.52) * k, (H - 1.52) * k, 0.9 * k);
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
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-6, 9, 12);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
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

  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.22 })); // taste-skill-ignore: rendered light under a floating object
  catcher.position.z = -7;
  catcher.receiveShadow = true;
  scene.add(catcher);

  const camera = new THREE.PerspectiveCamera(28, 1, 5, 120);
  camera.position.set(0, 0, 34);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const grain = new THREE.CanvasTexture(grainCanvas());
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(1 / W, 1 / H);
  grain.offset.set(0.5, 0.5);
  grain.anisotropy = maxAniso;

  const plateMat = new THREE.MeshPhysicalMaterial({ roughnessMap: grain, anisotropyRotation: 0, clearcoatRoughness: 0.35 });
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

  const faceH = Math.round((2048 * H) / W);
  const frontCanvas = Object.assign(document.createElement('canvas'), { width: 2048, height: faceH });
  const backCanvas = Object.assign(document.createElement('canvas'), { width: 2048, height: faceH });
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
  const chip = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.88, 0.03, 2, 0.09), chipMat);
  chip.position.set(-W / 2 + 1.58, 0.35, FACE_Z - 0.012);
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
  const pose = { x: 0.5, y: 0.5, s: 0.5, rx: -0.25, ry: -0.35, rz: 0.2, explode: 0, idle: 1 };
  const offset = { x: 0, y: 0, rx: 0, ry: 0, rz: 0, spin: 0, scale: 1 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

  if (window.matchMedia('(pointer: fine)').matches && motion) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

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
      duration: motion ? 1.3 : 0.6,
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
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const vh = 2 * tanHalf * camera.position.z;
    const vw = vh * camera.aspect;
    const idle = pose.idle * motion;
    const e = pose.explode;

    card.position.set((pose.x - 0.5 + offset.x) * vw, (0.5 - pose.y - offset.y) * vh, 0);
    card.scale.setScalar(((pose.s * vw) / W) * offset.scale);
    card.rotation.set(
      pose.rx + offset.rx + Math.sin(t * 0.7) * 0.035 * idle + pointer.y * 0.12 * idle,
      pose.ry + offset.ry + offset.spin + Math.sin(t * 0.45) * 0.07 * idle + pointer.x * 0.2 * idle,
      pose.rz + offset.rz + Math.sin(t * 0.55) * 0.02 * idle,
    );

    front.position.set(e * 0.5, e * 0.45, e * 3.2);
    chip.position.z = FACE_Z - 0.012 + e * 2.2;
    back.position.set(-e * 0.5, -e * 0.45, -e * 3.2);

    renderer.render(scene, camera);
  });

  const ready = Promise.all([
    document.fonts.load('600 40px "Barlow"'),
    document.fonts.load('500 40px "Barlow"'),
    document.fonts.load('700 40px "Barlow Condensed"'),
    document.fonts.load('500 40px "Barlow Condensed"'),
  ])
    .catch(() => {})
    .then(() => {
      if (finish) redraw();
    });

  return { pose, offset, setFinish, setName, ready };
}
