// 3D shirt for the prototype: one WebGL renderer, a canvas texture painted
// from the design (colour, crest, name, number, sleeve badge), an interactive
// viewer that can be mounted into any screen, and snapshots for the four views.
// Ported from the 3D Customization Engine PoC (texture engine + zone UVs).

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_URL = "assets/3d/sporty-tshirt.glb";
const TEXTURE_SIZE = 2048;

// Personalisation zones, in pixels on the 2048 × 2048 UV map.
export const ZONES = {
  crest: { x: 1640, y: 960, w: 170, h: 200 },
  back_name: { x: 264, y: 1000, w: 400, h: 130 },
  back_number: { x: 314, y: 1150, w: 300, h: 360 },
  sleeve_logo: { x: 1410, y: 390, w: 180, h: 180 },
};

export const VIEWS = {
  front: 0,
  right: Math.PI / 2,
  back: Math.PI,
  left: -Math.PI / 2,
};

let renderer, scene, camera, controls, mesh, material, texture, textureCanvas;
let fabricDetail = null;
let loading = null;
let mountedIn = null;
let resizeObserver = null;
let frame = 0;
let tween = null;
let spin = null;
const images = {};
let currentDesign = null;
let debugZones = false;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function isReady() {
  return Boolean(mesh);
}

export function load() {
  if (loading) return loading;
  loading = (async () => {
    const [gltf] = await Promise.all([
      new GLTFLoader().loadAsync(MODEL_URL),
      loadImage("assets/club-crest.svg").then((i) => (images.crest = i)),
      loadImage("assets/supporters-badge.svg").then((i) => (images.badge = i)),
      document.fonts.load('700 120px "Oswald"'),
    ]);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(30, 40, 40);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-30, 20, -30);
    scene.add(rim);

    const root = gltf.scene;
    root.traverse((child) => {
      if (child.isMesh && !mesh) {
        mesh = child;
        material = child.material;
      }
    });
    if (!mesh) throw new Error("No mesh in the shirt model");

    // The model ships with a "RUN" print on the front, baked into its colour,
    // roughness and normal maps. Patch it out of each of them.
    for (const slot of ["roughnessMap", "metalnessMap", "aoMap", "normalMap", "specularColorMap"]) {
      if (material[slot] && material[slot].image) material[slot] = patchedTexture(material[slot]);
    }
    // Keep the fabric weave and seam shading from the original base colour
    // map, in greyscale, and paint our colours over it.
    if (material.map && material.map.image) {
      fabricDetail = buildFabricDetail(removePrint(material.map.image, TEXTURE_SIZE));
    }

    textureCanvas = document.createElement("canvas");
    textureCanvas.width = TEXTURE_SIZE;
    textureCanvas.height = TEXTURE_SIZE;
    texture = new THREE.CanvasTexture(textureCanvas);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    material.map = texture;
    material.color = new THREE.Color(0xffffff);
    material.needsUpdate = true;

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
    scene.add(root);

    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
    camera.position.set(0, 2, 62);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 34;
    controls.maxDistance = 90;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.6;
    controls.addEventListener("start", () => {
      tween = null;
      spin = null;
    });

    setDesign(
      currentDesign || {
        color: "#F5F5F5",
        textColor: "#12305A",
        name: "",
        number: "",
        crest: true,
        badge: false,
      },
    );
    return true;
  })();
  return loading;
}

// Copy a clean piece of the front panel over the print area.
function removePrint(image, size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.drawImage(image, 0, 0, size, size);
  const f = (v) => Math.round(v * size);
  ctx.drawImage(c, f(0.655), f(0.745), f(0.235), f(0.195), f(0.655), f(0.486), f(0.235), f(0.25));
  return c;
}

const patched = new Map();
function patchedTexture(tex) {
  if (patched.has(tex)) return patched.get(tex);
  const img = tex.image;
  const size = img.width || img.naturalWidth || 1024;
  const t = new THREE.CanvasTexture(removePrint(img, size));
  t.flipY = tex.flipY;
  t.colorSpace = tex.colorSpace;
  t.wrapS = tex.wrapS;
  t.wrapT = tex.wrapT;
  t.channel = tex.channel;
  patched.set(tex, t);
  return t;
}

function buildFabricDetail(source) {
  const c = document.createElement("canvas");
  c.width = TEXTURE_SIZE;
  c.height = TEXTURE_SIZE;
  const ctx = c.getContext("2d");
  ctx.drawImage(source, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const data = ctx.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const d = data.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  const mean = sum / (d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Centre the detail on mid grey and soften it, for an overlay blend.
    const v = Math.max(0, Math.min(255, 128 + (l - mean) * 0.9));
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

export function paint(target, design) {
  const ctx = target.getContext("2d");
  const S = target.width / TEXTURE_SIZE;
  ctx.save();
  ctx.scale(S, S);
  ctx.fillStyle = design.color;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  if (fabricDetail) {
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(fabricDetail, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  if (design.crest && images.crest) drawContain(ctx, images.crest, ZONES.crest);
  if (design.badge && images.badge) drawContain(ctx, images.badge, ZONES.sleeve_logo);

  ctx.fillStyle = design.textColor || "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (design.name) {
    drawFitted(ctx, design.name.toUpperCase(), ZONES.back_name, 118);
  }
  if (design.number) {
    drawFitted(ctx, String(design.number), ZONES.back_number, 330);
  }

  if (debugZones) {
    ctx.lineWidth = 6;
    for (const [id, z] of Object.entries(ZONES)) {
      ctx.strokeStyle = "#E0479E";
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = "#E0479E";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText(id, z.x + z.w / 2, z.y - 30);
    }
  }
  ctx.restore();
}

function drawContain(ctx, img, z) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.min(z.w / iw, z.h / ih);
  const w = iw * s;
  const h = ih * s;
  ctx.drawImage(img, z.x + (z.w - w) / 2, z.y + (z.h - h) / 2, w, h);
}

function drawFitted(ctx, text, z, size) {
  let px = size;
  ctx.font = `700 ${px}px "Oswald", "Arial Narrow", sans-serif`;
  const width = ctx.measureText(text).width;
  if (width > z.w) {
    px = Math.floor(px * (z.w / width) * 0.96);
    ctx.font = `700 ${px}px "Oswald", "Arial Narrow", sans-serif`;
  }
  ctx.fillText(text, z.x + z.w / 2, z.y + z.h / 2 + px * 0.04);
}

export function setDesign(design) {
  currentDesign = { ...design };
  if (!textureCanvas) return;
  paint(textureCanvas, currentDesign);
  texture.needsUpdate = true;
}

export function setDebugZones(on) {
  debugZones = on;
  if (currentDesign) setDesign(currentDesign);
}

// The production file: the full-resolution artwork painted on the UV layout.
export function productionArtwork(design, size = 1024) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  paint(c, design);
  return c.toDataURL("image/png");
}

function resize() {
  if (!mountedIn) return;
  const w = mountedIn.clientWidth || 1;
  const h = mountedIn.clientHeight || 1;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  fitCamera(camera, camera.aspect);
  camera.updateProjectionMatrix();
}

function fitCamera(cam, aspect) {
  // Fit the 24 × 28 shirt with some air around it.
  const vFov = (cam.fov * Math.PI) / 180;
  const needH = 33;
  const needW = 29;
  const distH = needH / 2 / Math.tan(vFov / 2);
  const distW = needW / 2 / Math.tan(vFov / 2) / aspect;
  const dist = Math.max(distH, distW);
  const dir = cam.position.clone().normalize();
  if (!Number.isFinite(dir.x)) dir.set(0, 0, 1);
  cam.position.copy(dir.multiplyScalar(dist));
  if (controls) {
    controls.minDistance = dist * 0.6;
    controls.maxDistance = dist * 1.4;
  }
}

function loop() {
  frame = requestAnimationFrame(loop);
  const now = performance.now();
  if (tween) {
    const t = Math.min(1, (now - tween.start) / tween.duration);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const a = tween.from + (tween.to - tween.from) * e;
    setAzimuth(a, tween.radius, tween.y);
    if (t >= 1) tween = null;
  } else if (spin) {
    const t = Math.min(1, (now - spin.start) / spin.duration);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    setAzimuth(spin.from + e * Math.PI * 2, spin.radius, spin.y);
    if (t >= 1) spin = null;
  }
  controls.update();
  renderer.render(scene, camera);
}

function setAzimuth(a, radius, y) {
  camera.position.set(Math.sin(a) * radius, y, Math.cos(a) * radius);
  camera.lookAt(0, 0, 0);
}

function currentAzimuth() {
  return Math.atan2(camera.position.x, camera.position.z);
}

function horizontalRadius() {
  return Math.hypot(camera.position.x, camera.position.z);
}

export function mount(container) {
  if (!renderer) return;
  unmount();
  mountedIn = container;
  container.appendChild(renderer.domElement);
  renderer.domElement.classList.add("shirt-canvas");
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  setAzimuth(0, horizontalRadius(), camera.position.y);
  cancelAnimationFrame(frame);
  loop();
}

export function unmount() {
  cancelAnimationFrame(frame);
  if (resizeObserver) resizeObserver.disconnect();
  resizeObserver = null;
  if (renderer && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  mountedIn = null;
  tween = null;
  spin = null;
}

export function view(name, duration = 900) {
  if (!camera || !(name in VIEWS)) return Promise.resolve();
  const from = currentAzimuth();
  let to = VIEWS[name];
  // Take the short way round.
  while (to - from > Math.PI) to -= Math.PI * 2;
  while (to - from < -Math.PI) to += Math.PI * 2;
  spin = null;
  tween = {
    from,
    to,
    start: performance.now(),
    duration,
    radius: horizontalRadius(),
    y: camera.position.y,
  };
  return new Promise((r) => setTimeout(r, duration));
}

export function turntable(duration = 3600) {
  if (!camera) return Promise.resolve();
  tween = null;
  spin = {
    from: currentAzimuth(),
    start: performance.now(),
    duration,
    radius: horizontalRadius(),
    y: camera.position.y,
  };
  return new Promise((r) => setTimeout(r, duration));
}

// Four views of the design (front, back and both sides), as PNG data URLs.
export function snapshots(design, width = 480, height = 540) {
  if (!renderer) return null;
  setDesign(design);
  const snapCam = new THREE.PerspectiveCamera(30, width / height, 0.1, 500);
  snapCam.position.set(0, 2, 62);
  fitCamera(snapCam, width / height);
  const radius = Math.hypot(snapCam.position.x, snapCam.position.z);
  const prevSize = renderer.getSize(new THREE.Vector2());
  const prevRatio = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  const out = {};
  for (const [name, a] of Object.entries(VIEWS)) {
    snapCam.position.set(Math.sin(a) * radius, 2, Math.cos(a) * radius);
    snapCam.lookAt(0, 0, 0);
    renderer.render(scene, snapCam);
    out[name] = renderer.domElement.toDataURL("image/png");
  }
  renderer.setPixelRatio(prevRatio);
  renderer.setSize(prevSize.x, prevSize.y, false);
  if (mountedIn) {
    resize();
    renderer.render(scene, camera);
  }
  return out;
}
