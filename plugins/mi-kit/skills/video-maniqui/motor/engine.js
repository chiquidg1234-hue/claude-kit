// video-maniqui engine v2 — three.js diorama de maniquíes, determinista: todo es función de t.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const W = 1080, H = 1920;
// ---------- matemáticas deterministas ----------
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x) => Math.pow(clamp01(x), 3);
export const easeInOut = (x) => { x = clamp01(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// muelle cerrado: sobrepaso amortiguado (0→1). k = rigidez visual
export const spring = (x, k = 1) => x <= 0 ? 0 : 1 - Math.exp(-6 * x * k) * Math.cos(9 * x * k);
export const noise1 = (x) => { const i = Math.floor(x), f = x - i; const a = hash(i), b = hash(i + 1); return lerp(a, b, f * f * (3 - 2 * f)) * 2 - 1; };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.1, 900);
  const hemi = new THREE.HemisphereLight(0xcfd8e6, 0x4a3a26, 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2b8, 2.6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 220 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.0); scene.add(rim, rim.target);
  scene.fog = new THREE.Fog(0xb9b3a6, 40, 170);

  // ---------- texturas procedurales ----------
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  function canvasTex(w, h, draw, rep, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep, rep); t.anisotropy = 8; return t; }
  const woodTex = canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#d9ab74'); gr.addColorStop(.5, '#cf9d64'); gr.addColorStop(1, '#ddb27d'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { g.strokeStyle = `rgba(110,62,26,${0.04 + rnd() * 0.13})`; g.lineWidth = 0.6 + rnd() * 2.5; g.beginPath(); const x = rnd() * w; g.moveTo(x, 0); for (let y = 0; y <= h; y += 8) g.lineTo(x + Math.sin(y * 0.03 + i) * 5 + Math.sin(y * 0.11 + i * 3) * 1.5, y); g.stroke(); }
    for (let i = 0; i < 6; i++) { const x = rnd() * w, y = rnd() * h; for (let r = 3; r < 22; r += 3) { g.strokeStyle = `rgba(100,55,20,${0.18 - r * 0.006})`; g.beginPath(); g.ellipse(x, y, r * 0.5, r * 1.6, 0, 0, 7); g.stroke(); } } });
  const grassTex = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#5d7838'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${70 + rnd() * 50},${90 + rnd() * 40},${30 + rnd() * 20},.25)`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 60 + rnd() * 160, 40 + rnd() * 90, rnd() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 26000; i++) { const v = rnd(); g.fillStyle = v < .5 ? `rgba(38,58,18,${.15 + rnd() * .25})` : v < .85 ? `rgba(150,170,85,${.1 + rnd() * .18})` : `rgba(95,72,42,${.2 + rnd() * .3})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 2 + rnd() * 6); }
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(88,64,38,${.2 + rnd() * .3})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 12 + rnd() * 50, 6 + rnd() * 24, rnd() * 3, 0, 7); g.fill(); } }, 22);
  const mudTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#4e3a26'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${30 + rnd() * 60},${22 + rnd() * 40},${12 + rnd() * 20},${.3 + rnd() * .4})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 1 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, 7); g.fill(); } for (let i = 0; i < 25; i++) { g.fillStyle = 'rgba(160,170,180,.25)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 8 + rnd() * 30, 3 + rnd() * 10, rnd() * 3, 0, 7); g.fill(); } }, 30);
  const clothTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = 200 + rnd() * 55; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3); } for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(0,0,0,.04)'; g.fillRect(0, y, w, 1); } });
  // humo: atlas 2x2 de nubes suaves
  const smokeTex = canvasTex(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); for (let q = 0; q < 4; q++) { const ox = (q % 2) * 256, oy = Math.floor(q / 2) * 256; for (let i = 0; i < 70; i++) { const a = rnd() * 6.28, r = rnd() * 70; const x = ox + 128 + Math.cos(a) * r, y = oy + 128 + Math.sin(a) * r * 0.85; const rad = 22 + rnd() * 46; const gr = g.createRadialGradient(x, y, 0, x, y, rad); const l = 200 + rnd() * 55; gr.addColorStop(0, `rgba(${l},${l},${l},${0.16 + rnd() * 0.12})`); gr.addColorStop(1, `rgba(${l},${l},${l},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); } } }, 0, false);
  smokeTex.wrapS = smokeTex.wrapT = THREE.ClampToEdgeWrapping;
  const glowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,230,180,.8)'); gr.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 0, false);

  // ---------- materiales ----------
  const M = {
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: .5 }),
    joint: new THREE.MeshStandardMaterial({ color: 0x6e4222, roughness: .35 }),
    dyed: new THREE.MeshStandardMaterial({ map: clothTex, roughness: .85 }),
    flat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: .35, metalness: .6 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: .35, metalness: .75 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd8b04a, roughness: .3, metalness: .9, emissive: 0x221500 }),
    darkwood: new THREE.MeshStandardMaterial({ map: woodTex, color: 0x7a5a40, roughness: .7 }),
  };

  // ---------- cielo ----------
  const skyU = { top: { value: new THREE.Color(0x5a7aa0) }, hor: { value: new THREE.Color(0xd8c8a8) }, sunDir: { value: V(0, .3, -1) }, sunCol: { value: new THREE.Color(0xffd8a0) }, cloud: { value: 0.5 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 top,hor,sunDir,sunCol; uniform float cloud; varying vec3 vD;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
      void main(){ float y=max(vD.y,0.); vec3 c=mix(hor,top,pow(y,.55)); float sd=max(dot(normalize(vD),normalize(sunDir)),0.);
        c+=sunCol*(pow(sd,180.)*2.5+pow(sd,8.)*.35); vec2 uv=vD.xz/(vD.y+.15)*1.6; float cl=smoothstep(.45,.85,fbm(uv)); c=mix(c,mix(hor*1.05,vec3(1.)*.92,.4)+sunCol*pow(sd,4.)*.3,cl*cloud*smoothstep(0.,.25,y));
        gl_FragColor=vec4(c,1.); }` }));
  sky.frustumCulled = false; scene.add(sky);

  // ---------- terreno ----------
  const hgt = (x, z) => 1.6 * Math.sin(x * 0.035) * Math.cos(z * 0.03) + 0.8 * Math.sin(z * 0.07 + 1) + (z < -10 ? Math.min(1, (-10 - z) / 25) * 3 : 0) + (z > 14 ? Math.min(1, (z - 14) / 25) * 2.4 : 0);
  const groundMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: .95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 200, 200), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  { const p = ground.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, hgt(x, -y)); } ground.geometry.computeVertexNormals(); }
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1b3045, roughness: .18, metalness: .35 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = 0.2; scene.add(sea);
  const island = new THREE.Mesh(new THREE.DodecahedronGeometry(6, 1), new THREE.MeshStandardMaterial({ color: 0x55544a, roughness: 1, flatShading: true }));
  island.scale.set(1.3, 0.55, 1.1); island.castShadow = island.receiveShadow = true; scene.add(island);
  // granjas (Hougoumont / La Haye Sainte)
  function makeFarm() { const g = new THREE.Group(); const wall = new THREE.MeshStandardMaterial({ color: 0xd9cdb5, roughness: .9 }), roof = new THREE.MeshStandardMaterial({ color: 0x8a3b2a, roughness: .8 });
    const add = (w, h, d, x, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; g.add(b);
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0, Math.max(w, d) * 0.62, 2.2, 4, 1), roof); r.position.set(x, h + 1.1, z); r.rotation.y = Math.PI / 4; r.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); r.castShadow = true; g.add(r); };
    add(9, 4, 4, 0, 0); add(4, 3.4, 8, -6, 3); add(7, 3, 3.5, 1, 7); scene.add(g); return g; }
  const farm = makeFarm();
  // árboles y trigo (instanciados)
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshStandardMaterial({ color: 0x3d5828, roughness: 1, flatShading: true }), 220); trees.castShadow = true;
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(); for (let i = 0; i < 220; i++) { const a = hash(i) * Math.PI * 2, r = 50 + hash(i + 9) * 110; const x = Math.cos(a) * r, z = Math.sin(a) * r; m.compose(V(x, hgt(x, z) + 2.6, z), q, V(1 + hash(i + 1) * .5, 1.2 + hash(i + 3), 1 + hash(i + 2) * .5)); trees.setMatrixAt(i, m); } }
  scene.add(trees);
  const WHEAT = 5000; const wheat = new THREE.InstancedMesh(new THREE.ConeGeometry(.05, .9, 4), new THREE.MeshStandardMaterial({ color: 0xc8a94e, roughness: .9 }), WHEAT); wheat.receiveShadow = true;
  wheat.frustumCulled = false; scene.add(wheat);
  function setWheat(cx, cz, w, d, t = 0) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let n = 0;
    for (let i = 0; i < WHEAT; i++) { const x = cx + (hash(i * 1.3) - .5) * w, z = cz + (hash(i * 2.7 + 1) - .5) * d; e.set(Math.sin(t * 1.3 + x * .4) * .12 + (hash(i) - .5) * .2, 0, Math.cos(t + z * .3) * .1); q.setFromEuler(e); m.compose(V(x, hgt(x, z) + .4, z), q, V(1, .7 + hash(i + 5) * .6, 1)); wheat.setMatrixAt(n++, m); }
    wheat.count = n; wheat.instanceMatrix.needsUpdate = true; wheat.visible = true; }

  // ---------- rig de maniquí instanciado ----------
  const MAXF = 900;
  const SPH = new THREE.SphereGeometry(1, 18, 12);
  const parts = {};
  function part(name, geo, mat, mult, colored) { const m = new THREE.InstancedMesh(geo, mat, MAXF * mult); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; if (colored) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXF * mult * 3).fill(1), 3); scene.add(m); parts[name] = { mesh: m, n: 0 }; }
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 5, 10);
  part('pelvis', SPH, M.dyed, 1, true); part('chest', SPH, M.dyed, 1, true); part('neck', new THREE.CylinderGeometry(.05, .06, .14, 10), M.wood, 1);
  part('head', SPH, M.wood, 1); part('nose', SPH, M.wood, 1); part('uarm', cap(.058, .24), M.dyed, 2, true); part('farm', cap(.046, .22), M.wood, 2);
  part('hand', SPH, M.wood, 2); part('thigh', cap(.078, .34), M.dyed, 2, true); part('shin', cap(.06, .34), M.wood, 2);
  part('foot', new THREE.BoxGeometry(.1, .07, .25), M.joint, 2); part('joint', SPH, M.joint, 9);
  part('belt', new THREE.BoxGeometry(.06, .62, .02), M.flat, 2, true);
  part('musket', new THREE.CylinderGeometry(.017, .022, 1.45, 6), M.darkwood, 1);
  part('bayonet', new THREE.ConeGeometry(.012, .38, 4), M.metal, 1);
  const bic = () => { const g = new THREE.CylinderGeometry(.2, .2, .07, 24, 1, false, 0, Math.PI); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 2); return g; };
  part('bicorne', (() => { const g = bic(); g.scale(.8, .6, .42); return g; })(), M.flat, 1, true);
  part('bicorneW', (() => { const g = bic(); g.rotateY(Math.PI / 2); g.scale(.45, .72, .9); return g; })(), M.flat, 1, true);
  part('shako', new THREE.CylinderGeometry(.11, .095, .21, 16), M.flat, 1, true);
  part('bearskin', (() => { const g = new THREE.CylinderGeometry(.115, .1, .4, 14); g.scale(1, 1, .92); return g; })(), M.flat, 1, true);
  part('cap', new THREE.CylinderGeometry(.12, .11, .09, 16), M.flat, 1, true);
  part('plate', new THREE.BoxGeometry(.07, .07, .015), M.gold, 1);
  part('epaulette', new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, 2);
  // caballo
  part('hbody', SPH, M.wood, 1); part('hneck', cap(.16, .6), M.wood, 1); part('hhead', cap(.12, .42), M.wood, 1);
  part('hleg', cap(.06, .75), M.wood, 4); part('hjoint', SPH, M.joint, 4); part('htail', cap(.05, .5), M.joint, 1); part('hmane', new THREE.BoxGeometry(.05, .55, .1), M.joint, 1);

  const O = () => new THREE.Object3D();
  const R = { nose: O(), root: O(), hips: O(), spine: O(), chest: O(), neck: O(), head: O(), hat: O(), plate: O(), musket: O(), bayo: O(), sh: [O(), O()], el: [O(), O()], hand: [O(), O()], hip: [O(), O()], kn: [O(), O()], ank: [O(), O()],
    pelvisM: O(), chestM: O(), neckM: O(), headM: O(), uaM: [O(), O()], faM: [O(), O()], handM: [O(), O()], thM: [O(), O()], shM: [O(), O()], footM: [O(), O()], belt: [O(), O()], ep: [O(), O()] };
  R.root.add(R.hips); R.hips.position.y = 1.0; R.hips.add(R.pelvisM); R.pelvisM.scale.set(.17, .12, .12);
  R.hips.add(R.spine); R.spine.add(R.chest); R.chest.position.y = .32; R.chest.add(R.chestM); R.chestM.scale.set(.2, .27, .13); R.chestM.position.y = .02;
  R.chest.add(R.neck); R.neck.position.y = .3; R.neck.add(R.neckM); R.neckM.position.y = .04; R.neck.add(R.head); R.head.position.y = .17; R.head.add(R.headM); R.headM.scale.set(.1, .13, .11); R.head.add(R.nose); R.nose.position.set(0, -.005, .1); R.nose.scale.set(.022, .045, .035);
  R.head.add(R.hat); R.hat.position.y = .13; R.hat.add(R.plate); R.chest.add(R.musket); R.musket.add(R.bayo); R.bayo.position.y = .9;
  for (const s of [0, 1]) { const sg = s ? 1 : -1;
    R.chest.add(R.belt[s]); R.belt[s].position.set(0, .02, .12); R.belt[s].rotation.set(-.12, 0, sg * .62);
    R.chest.add(R.sh[s]); R.sh[s].position.set(.23 * sg, .2, 0); R.sh[s].add(R.uaM[s]); R.uaM[s].position.y = -.16; R.sh[s].add(R.ep[s]); R.ep[s].scale.set(.075, .04, .075); R.ep[s].position.y = .03;
    R.sh[s].add(R.el[s]); R.el[s].position.y = -.32; R.el[s].add(R.faM[s]); R.faM[s].position.y = -.15; R.el[s].add(R.hand[s]); R.hand[s].position.y = -.31; R.hand[s].add(R.handM[s]); R.handM[s].scale.setScalar(.056);
    R.hips.add(R.hip[s]); R.hip[s].position.set(.1 * sg, -.06, 0); R.hip[s].add(R.thM[s]); R.thM[s].position.y = -.22;
    R.hip[s].add(R.kn[s]); R.kn[s].position.y = -.45; R.kn[s].add(R.shM[s]); R.shM[s].position.y = -.22; R.kn[s].add(R.ank[s]); R.ank[s].position.y = -.47; R.ank[s].add(R.footM[s]); R.footM[s].position.set(0, -.01, .05); }
  const HR = { root: O(), body: O(), bodyM: O(), neck: O(), neckM: O(), head: O(), headM: O(), tail: O(), mane: O(), legs: [O(), O(), O(), O()], legM: [O(), O(), O(), O()], saddle: O() };
  HR.root.add(HR.body); HR.body.position.y = 1.35; HR.body.add(HR.bodyM); HR.bodyM.scale.set(.32, .36, .85);
  HR.body.add(HR.neck); HR.neck.position.set(0, .2, .7); HR.neck.add(HR.neckM); HR.neckM.position.y = .35; HR.neck.add(HR.mane); HR.mane.position.set(0, .4, -.12);
  HR.neck.add(HR.head); HR.head.position.y = .72; HR.head.rotation.x = 1.25; HR.head.add(HR.headM); HR.headM.position.y = .2;
  HR.body.add(HR.tail); HR.tail.position.set(0, .15, -.82); HR.body.add(HR.saddle); HR.saddle.position.y = .38;
  [[.18, .55], [-.18, .55], [.18, -.6], [-.18, -.6]].forEach(([x, z], i) => { HR.body.add(HR.legs[i]); HR.legs[i].position.set(x, -.15, z); HR.legs[i].add(HR.legM[i]); HR.legM[i].position.y = -.52; });

  const C = (h) => new THREE.Color(h);
  const TEAM = { fr: { coat: C(0x23418f), legs: C(0xe8e2d0), belt: C(0xf2efe6) }, gb: { coat: C(0xb3261f), legs: C(0x6b6e74), belt: C(0xf2efe6) }, pr: { coat: C(0x1f2433), legs: C(0x5b5e66), belt: C(0x2a2a2a) },
    nap: { coat: C(0x8c8d88), legs: C(0xe8e2d0), belt: null }, well: { coat: C(0x1c2440), legs: C(0xe8e2d0), belt: null }, guard: { coat: C(0x1c3170), legs: C(0xe8e2d0), belt: C(0xf2efe6) }, wood: { coat: C(0xffffff), legs: C(0xffffff), belt: null } };
  const HATC = { bicorne: C(0x161616), bicorneW: C(0x161616), shako: C(0x151515), bearskin: C(0x120e0b), cap: C(0x1d1e22) };
  const tmpM = new THREE.Matrix4(), tmpS = new THREE.Matrix4();
  function put(name, obj, color, scale) { const p = parts[name]; if (p.n >= p.mesh.instanceMatrix.count) return; obj.updateWorldMatrix(true, false); tmpM.copy(obj.matrixWorld); if (scale) tmpM.multiply(tmpS.makeScale(scale[0], scale[1], scale[2])); p.mesh.setMatrixAt(p.n, tmpM); if (color && p.mesh.instanceColor) p.mesh.setColorAt(p.n, color); p.n++; }

  // figure(p): x,z,y,ry,s,team,hat,musket('shoulder'|'port'|'aim'|'charge'),walk(fase),amp,run,lean,headP,headY,armUp[l,r],point,kneel,sit,fall(0..1),fallSide,recoil(0..1),id
  function figure(p) {
    const s = p.s || 1, id = p.id || 0;
    const fall = p.fall || 0;
    R.root.position.set(p.x, (p.y !== undefined ? p.y : hgt(p.x, p.z)), p.z);
    R.root.rotation.set(-fall * 1.5 * (p.fallBack === false ? -1 : 1), p.ry || 0, (p.roll || 0) + fall * (p.fallSide || 0) * .4, 'YXZ'); R.root.scale.setScalar(s);
    const ph = p.walk, amp = (p.amp ?? 0.5) * (p.run ? 1.5 : 1); const sw = ph === undefined ? 0 : Math.sin(ph);
    const breath = Math.sin((p.t ?? 0) * 2.2 + id * 1.7);
    R.hips.position.y = 1.0 + (ph === undefined ? 0 : Math.abs(Math.cos(ph)) * 0.05 * amp * 2) - (p.kneel ? 0.42 : 0) - fall * 0.1;
    R.hips.rotation.set(0, ph === undefined ? 0 : sw * 0.12 * amp, ph === undefined ? 0 : Math.cos(ph) * 0.03);
    R.spine.rotation.set((p.lean || 0) + (p.run ? 0.25 : 0) - (p.recoil || 0) * 0.2 + fall * 0.3, ph === undefined ? 0 : -sw * 0.2 * amp, 0);
    R.chest.scale.setScalar(1 + breath * 0.012);
    R.neck.rotation.set(0, 0, 0); R.head.rotation.set((p.headP || 0) + (ph === undefined ? 0 : Math.sin(ph * 2) * 0.04), (p.headY || 0) + noise1((p.t ?? 0) * 0.4 + id * 3) * (p.look ?? 0.12), 0);
    for (const sd of [0, 1]) { const sg = sd ? 1 : -1; const leg = sd ? sw : -sw;
      if (p.sit) { R.hip[sd].rotation.set(-1.45, 0, -.35 * sg); R.kn[sd].rotation.set(1.5, 0, 0); }
      else if (p.kneel && sd === 0) { R.hip[sd].rotation.set(-1.4, 0, 0); R.kn[sd].rotation.set(1.45, 0, 0); }
      else if (p.kneel) { R.hip[sd].rotation.set(.1, 0, 0); R.kn[sd].rotation.set(1.6, 0, 0); }
      else { R.hip[sd].rotation.set(-leg * amp - fall * 0.6 * (sd ? 1 : 0.4), 0, .03 * sg); R.kn[sd].rotation.set(Math.max(0, leg) * amp * 1.4 + fall * 0.9, 0, 0); }
      R.ank[sd].rotation.set(0, 0, 0);
      const up = (p.armUp && p.armUp[sd]) || 0;
      R.sh[sd].rotation.set(leg * amp * 0.9 - up * 2.6 - fall * 2.2, 0, sg * (0.12 + up * 0.25 + fall * 0.5)); R.el[sd].rotation.set(-0.25 - up * 0.2 - (ph === undefined ? 0 : Math.max(0, leg) * 0.5), 0, 0); }
    if (p.point) { R.sh[1].rotation.set(-1.55 * p.point, 0, .05); R.el[1].rotation.set(-0.05, 0, 0); }
    const mk = fall > 0.5 ? null : p.musket; R.musket.visible = !!mk;
    const rk = p.recoil || 0;
    if (mk === 'shoulder') { R.sh[1].rotation.set(-0.15 + (ph === undefined ? 0 : sw * 0.08), 0, .1); R.el[1].rotation.set(-1.7, 0, 0); R.musket.position.set(.27, .25, .08); R.musket.rotation.set(0, 0, 0); }
    if (mk === 'port') { R.sh[1].rotation.set(-0.5, 0, .1); R.el[1].rotation.set(-1.2, 0, -.6); R.sh[0].rotation.set(-0.7, 0, -.1); R.el[0].rotation.set(-1.3, 0, .7); R.musket.position.set(0, .05, .25); R.musket.rotation.set(0, 0, 0.9); }
    if (mk === 'charge') { R.sh[1].rotation.set(-0.9, 0, -.1); R.el[1].rotation.set(-0.9, 0, 0); R.sh[0].rotation.set(-1.25, 0, .3); R.el[0].rotation.set(-.3, 0, 0); R.musket.position.set(.05, .05, .45); R.musket.rotation.set(1.35, 0, 0); }
    if (mk === 'aim') { R.sh[1].rotation.set(-1.4 + rk * .35, 0, -.1); R.el[1].rotation.set(-.5, 0, 0); R.sh[0].rotation.set(-1.45 + rk * .3, 0, .55); R.el[0].rotation.set(-.15, 0, 0); R.musket.position.set(.03, .32, .55 - rk * .12); R.musket.rotation.set(Math.PI / 2 + rk * .35, 0, 0); R.head.rotation.set(.12, 0.25, 0); }
    const T = TEAM[p.team || 'wood'];
    put('pelvis', R.pelvisM, T.legs); put('chest', R.chestM, T.coat); put('neck', R.neckM); put('head', R.headM); put('nose', R.nose);
    for (const sd of [0, 1]) { put('uarm', R.uaM[sd], T.coat); put('farm', R.faM[sd]); put('hand', R.handM[sd]); put('thigh', R.thM[sd], T.legs); put('shin', R.shM[sd]); put('foot', R.footM[sd]);
      for (const j of [R.sh[sd], R.el[sd], R.hip[sd], R.kn[sd]]) put('joint', j, null, [.07, .07, .07]);
      if (T.belt) put('belt', R.belt[sd], T.belt);
      if (p.ep) put('epaulette', R.ep[sd]); }
    put('joint', R.neck, null, [.06, .06, .06]);
    if (mk) { put('musket', R.musket); if (p.bayonet !== false) put('bayonet', R.bayo); }
    if (p.hat) { const off = { bicorne: .02, shako: .08, bearskin: .17, bicorneW: .03, cap: .02 }[p.hat]; R.hat.position.y = .1 + off; put(p.hat, R.hat, HATC[p.hat]);
      if (p.hat === 'shako' || p.hat === 'bearskin') { R.plate.position.set(0, p.hat === 'shako' ? 0 : -.08, .11); put('plate', R.plate); } }
  }
  function horse(h) {
    HR.root.position.set(h.x, hgt(h.x, h.z), h.z); HR.root.rotation.set(0, h.ry || 0, 0);
    const ph = h.gallop; const g = ph === undefined ? 0 : 1; const rear = h.rear || 0;
    HR.body.position.y = 1.35 + (g ? Math.sin(ph * 2) * 0.09 : 0) + rear * 0.4; HR.body.rotation.x = (g ? Math.sin(ph) * 0.09 : 0) - rear * 0.75;
    HR.neck.rotation.x = .75 + (g ? Math.sin(ph + 1) * 0.15 : 0) - rear * .3; HR.head.rotation.x = 1.25 + (g ? Math.sin(ph + 2) * .1 : 0);
    HR.tail.rotation.x = -2.5 + (g ? Math.sin(ph * 2 + 1) * .25 : 0);
    const off = [0, .3, .55, .85];
    HR.legs.forEach((l, i) => { l.rotation.x = g ? Math.sin(ph + off[i] * Math.PI * 2) * 0.75 : (i < 2 ? -rear * 1.2 : 0); });
    put('hbody', HR.bodyM); put('hneck', HR.neckM); put('hhead', HR.headM); put('htail', HR.tail, null, [1, 1, 1]); put('hmane', HR.mane, null, [1, 1, 1]);
    HR.legs.forEach((l, i) => { put('hleg', HR.legM[i]); put('hjoint', l, null, [.1, .1, .1]); });
    if (h.rider) { HR.saddle.updateWorldMatrix(true, false); const wp = new THREE.Vector3().setFromMatrixPosition(HR.saddle.matrixWorld);
      figure(Object.assign({ x: wp.x, y: wp.y - 1.0 + 0.08, z: wp.z, ry: h.ry, sit: true, lean: (h.lean ?? 0.15) - rear * .5, armUp: h.sabre ? [0, 0.7 + Math.sin((ph || 0) * 2) * 0.2] : [0, 0], t: h.t, id: h.id }, h.rider)); }
  }
  // ---------- cañones (pocos: mallas normales) ----------
  const cannons = [];
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const car = new THREE.Mesh(new THREE.BoxGeometry(.5, .35, 1.9), M.darkwood); car.position.set(0, .55, -.35); car.rotation.x = -.18;
    const barrel = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(.11, .17, 1.9, 14), M.bronze); b.rotation.x = Math.PI / 2; b.position.z = .6; barrel.add(b); const muz = new THREE.Mesh(new THREE.TorusGeometry(.12, .035, 8, 14), M.bronze); muz.position.z = 1.55; barrel.add(muz); barrel.position.set(0, .82, 0);
    const wheels = []; for (const sx of [-.38, .38]) { const w = new THREE.Group(); const rim = new THREE.Mesh(new THREE.TorusGeometry(.55, .045, 8, 22), M.darkwood); rim.rotation.y = Math.PI / 2; w.add(rim); for (let k = 0; k < 6; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1.05, 5), M.darkwood); sp.rotation.x = k * Math.PI / 6; w.add(sp); } w.position.set(sx, .58, .05); g.add(w); wheels.push(w); }
    g.add(car, barrel); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.visible = false; scene.add(g); cannons.push({ g, barrel, wheels }); }
  let cannonN = 0;
  // cannon({x,z,ry,fire:[t0...],t}) -> devuelve posición de la boca
  function cannon(c) { const k = cannons[cannonN++]; if (!k) return null; k.g.visible = true; k.g.position.set(c.x, hgt(c.x, c.z), c.z); k.g.rotation.set(0, c.ry || 0, 0);
    let rec = 0; for (const tf of c.fire || []) { const a = c.t - tf; if (a > 0) rec = Math.max(rec, Math.exp(-a * 3) * Math.min(1, a * 40)); }
    k.g.position.x -= Math.sin(c.ry || 0) * rec * .7; k.g.position.z -= Math.cos(c.ry || 0) * rec * .7; k.barrel.rotation.x = -rec * .15 - (c.elev || 0.05); k.wheels.forEach(w => w.rotation.x = -rec * 1.3);
    k.g.updateMatrixWorld(true); const m = V(0, 0, 1.6).applyMatrix4(k.barrel.matrixWorld);
    for (const tf of c.fire || []) { const a = c.t - tf; if (a > -0.01 && a < 4) muzzle(m, V(Math.sin(c.ry || 0), .05, Math.cos(c.ry || 0)), a, 2.2, c.id || 0); }
    return m; }
  // ---------- banderas (shader con ondas) ----------
  const flagTex = { fr: canvasTex(256, 160, (g) => { ['#1d3c9a', '#f4f1e8', '#c42a2a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 85.3, 0, 86, 160); }); g.fillStyle = '#d8b04a'; g.font = 'bold 26px serif'; g.textAlign = 'center'; g.fillText('N', 128, 92); }),
    gb: canvasTex(256, 160, (g) => { g.fillStyle = '#16307a'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#fff'; g.lineWidth = 30; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 160); g.moveTo(256, 0); g.lineTo(0, 160); g.stroke(); g.strokeStyle = '#c8202f'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#fff'; g.fillRect(0, 56, 256, 48); g.fillRect(104, 0, 48, 160); g.fillStyle = '#c8202f'; g.fillRect(0, 66, 256, 28); g.fillRect(114, 0, 28, 160); }),
    pr: canvasTex(256, 160, (g) => { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#151515'; g.fillRect(0, 0, 256, 18); g.fillRect(0, 142, 256, 18); g.beginPath(); g.ellipse(128, 80, 30, 36, 0, 0, 7); g.fill(); }) };
  const flagU = { t: { value: 0 } };
  const flags = []; const poleMat = M.darkwood;
  for (let i = 0; i < 10; i++) { const geo = new THREE.PlaneGeometry(1.5, .95, 24, 8); geo.translate(.75, 0, 0);
    const mat = new THREE.MeshStandardMaterial({ map: flagTex.fr, side: THREE.DoubleSide, roughness: .8 });
    mat.onBeforeCompile = (sh) => { sh.uniforms.ft = flagU.t; sh.vertexShader = 'uniform float ft;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float k = position.x/1.5; transformed.z += sin(position.x*4.0 - ft*7.0)*0.16*k + sin(position.y*3.0+ft*3.0)*0.04*k; transformed.y -= k*k*0.12;'); };
    const f = new THREE.Mesh(geo, mat); f.castShadow = true; const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3.2, 6), poleMat); pole.position.set(0, -1.1, 0);
    const eagle = new THREE.Mesh(new THREE.OctahedronGeometry(.1, 0), M.gold); eagle.position.set(0, .55, 0);
    const g = new THREE.Group(); g.add(f, pole, eagle); g.visible = false; scene.add(g); flags.push({ g, f, eagle }); }
  let flagN = 0;
  function flag(o) { const k = flags[flagN++]; if (!k) return; k.g.visible = true; k.f.material.map = flagTex[o.team]; k.eagle.visible = o.team === 'fr'; k.g.position.set(o.x, (o.y ?? hgt(o.x, o.z)) + 2.6, o.z); k.g.rotation.set(0, o.ry ?? 0, 0); k.g.scale.setScalar(o.s || 1); }

  // ---------- partículas billboard (humo, polvo, fogonazos) ----------
  function billboardLayer(n, additive) {
    const geo = new THREE.PlaneGeometry(1, 1); const data = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); geo.setAttribute('aData', data);
    const col = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); geo.setAttribute('aCol', col);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: additive ? glowTex : smokeTex }, fogColor: { value: new THREE.Color() }, fogNear: { value: 40 }, fogFar: { value: 170 }, sunCol: { value: new THREE.Color(1, .9, .8) }, amb: { value: new THREE.Color(.5, .5, .55) } },
      vertexShader: `attribute vec4 aData; attribute vec3 aCol; varying vec2 vUv; varying float vOp; varying vec3 vCol; varying float vFog; varying float vSeed;
        void main(){ vUv=uv; vOp=aData.x; vCol=aCol; vSeed=aData.w; vec3 c=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz; float sc=length(instanceMatrix[0].xyz);
          vec4 mv=modelViewMatrix*vec4(c,1.); float a=aData.y; mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a)); mv.xy+=r*position.xy*sc; vFog=-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: additive ? `uniform sampler2D map; varying vec2 vUv; varying float vOp; varying vec3 vCol; varying float vFog; void main(){ vec4 t=texture2D(map,vUv); gl_FragColor=vec4(vCol*t.rgb*vOp*t.a,1.); }`
        : `uniform sampler2D map; uniform vec3 fogColor,sunCol,amb; uniform float fogNear,fogFar; varying vec2 vUv; varying float vOp; varying vec3 vCol; varying float vFog; varying float vSeed;
        void main(){ float q=floor(vSeed*4.); vec2 uv=vUv*.5+vec2(mod(q,2.),floor(q/2.))*.5; vec4 t=texture2D(map,uv); float lit=clamp(.55+vUv.y*.6,0.,1.);
          vec3 c=vCol*mix(amb,sunCol,lit)*(.75+.35*t.r); float f=smoothstep(fogNear,fogFar,vFog); c=mix(c,fogColor,f); gl_FragColor=vec4(c,t.a*vOp*3.2); }` });
    const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.renderOrder = additive ? 11 : 10; scene.add(m); return { m, data, col, n: 0, cap: n };
  }
  const smoke = billboardLayer(2600, false), glow = billboardLayer(900, true);
  const pm = new THREE.Matrix4(), pq = new THREE.Quaternion();
  function emit(L, x, y, z, size, op, rot, seedv, r, g, b) { if (L.n >= L.cap) return; pm.compose(V(x, y, z), pq, V(size, size, size)); L.m.setMatrixAt(L.n, pm); L.data.setXYZW(L.n, op, rot, 0, seedv); L.col.setXYZ(L.n, r, g, b); L.n++; }
  // nube de humo envejeciendo: age en s
  function puff(x, y, z, age, size = 1, id = 0, col = [.93, .91, .88], life = 5) { if (age < 0 || age > life) return; const k = age / life; const sz = size * (0.5 + Math.sqrt(age) * 1.3);
    const op = Math.min(1, age * 6) * Math.pow(1 - k, 1.6) * 0.55; const dx = noise1(id * 7 + age * .3) * .6 + age * 0.35, dy = age * 0.35 + hash(id) * .2;
    emit(smoke, x + dx, y + dy, z + noise1(id * 3 + age * .2) * .4, sz, op, hash(id * 5) * 6 + age * .15 * (hash(id) - .5), hash(id * 9.1), col[0], col[1], col[2]); }
  function dust(x, y, z, age, size = 1, id = 0) { puff(x, y, z, age, size, id, [.62, .52, .4], 2.5); }
  function spark(x, y, z, size, op, r = 1.6, g = 1.1, b = .55) { emit(glow, x, y, z, size, op, 0, 0, r, g, b); }
  // fogonazo de mosquete/cañón: destello + chispas + humo
  function muzzle(p, dir, age, power = 1, id = 0) { if (age < 0) return;
    if (age < 0.09) { const k = 1 - age / 0.09; spark(p.x + dir.x * .3 * power, p.y + dir.y * .3, p.z + dir.z * .3 * power, .75 * power, 1.8 * k, 2.4, 1.6, .7); spark(p.x, p.y, p.z, .3 * power, 2.4 * k, 3, 2.6, 1.6); }
    if (age < 0.5) for (let i = 0; i < 6 * power; i++) { const h = hash(id * 13 + i), v = 6 + h * 8; const a = age; spark(p.x + (dir.x * v + (hash(i + id) - .5) * 3) * a, p.y + (dir.y * v + 2) * a - 5 * a * a, p.z + (dir.z * v + (hash(i * 3 + id) - .5) * 3) * a, .08, (1 - a / .5) * 2.2); }
    for (let i = 0; i < 3 + 2 * power; i++) puff(p.x + dir.x * (i * .35 * power), p.y, p.z + dir.z * (i * .35 * power), age - i * 0.02, .45 * power, id * 31 + i); }

  // lluvia
  const RAINN = 3000; const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(RAINN * 6), 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb8c6d6, transparent: true, opacity: .5 })); rain.frustumCulled = false; scene.add(rain);
  function setRain(t, cx, cz) { rain.visible = true; const a = rainGeo.attributes.position.array; for (let i = 0; i < RAINN; i++) { const x = cx + (hash(i) - .5) * 30, z = cz + (hash(i + .5) - .5) * 30; const y = ((hash(i + .3) * 14 - t * 20) % 14 + 14) % 14; a.set([x, y, z, x + .06, y + .7, z], i * 6); } rainGeo.attributes.position.needsUpdate = true; }

  // ---------- post-proceso ----------
  const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
  const renderPass = new RenderPass(scene, cam); composer.addPass(renderPass);
  // profundidad de campo barata: lee el depth buffer del RenderPass (sin segundo render de la escena)
  for (const rt of [composer.renderTarget1, composer.renderTarget2]) { rt.depthTexture = new THREE.DepthTexture(W, H); rt.depthTexture.type = THREE.UnsignedIntType; }
  const bokeh = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: composer.renderTarget1.depthTexture }, focus: { value: 10 }, aperture: { value: .0006 }, maxblur: { value: .01 }, near: { value: .1 }, far: { value: 900 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `#include <packing>
      uniform sampler2D tDiffuse, tDepth; uniform float focus, aperture, maxblur, near, far; varying vec2 vUv;
      float vz(vec2 uv){ return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
      void main(){ float z = vz(vUv); float coc = clamp(abs(z - focus) / z * aperture * 600., 0., maxblur);
        vec2 r = vec2(coc * .5625, coc); vec4 acc = texture2D(tDiffuse, vUv); float wsum = 1.;
        for (int i = 0; i < 10; i++) { float a = float(i) * 2.39996; float rr = sqrt(float(i) + .5) / 3.2; vec2 o = vec2(cos(a), sin(a)) * rr * r;
          float zs = vz(vUv + o); float w = zs < z ? 1. : clamp(abs(zs - focus) / zs * aperture * 600. / max(coc, 1e-4), 0., 1.);
          acc += texture2D(tDiffuse, vUv + o) * w; wsum += w; }
        gl_FragColor = acc / wsum; }` });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.6, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, exposure: { value: 1 }, contrast: { value: 1.08 }, sat: { value: 1.05 }, shadowTint: { value: new THREE.Color(0.0, 0.03, 0.06) }, highTint: { value: new THREE.Color(0.06, 0.03, -0.02) },
      vig: { value: 0.45 }, ca: { value: 0.0015 }, grain: { value: 0.05 }, whip: { value: new THREE.Vector2(0, 0) }, flash: { value: 0 }, fade: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time,exposure,contrast,sat,vig,ca,grain,flash,fade; uniform vec3 shadowTint,highTint; uniform vec2 whip; varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time*7.13)*43758.5453);}
      vec3 samp(vec2 uv){ vec2 d=(uv-.5); vec3 c; c.r=texture2D(tDiffuse,uv+d*ca).r; c.g=texture2D(tDiffuse,uv).g; c.b=texture2D(tDiffuse,uv-d*ca).b; return c; }
      void main(){ vec3 c=vec3(0.); float wl=length(whip);
        if(wl>0.0005){ for(int i=0;i<14;i++){ float k=float(i)/13.-.5; c+=samp(vUv+whip*k); } c/=14.; } else c=samp(vUv);
        c*=exposure; c=(c-.5)*contrast+.5; float l=dot(c,vec3(.299,.587,.114)); c=mix(vec3(l),c,sat);
        c+=shadowTint*(1.-smoothstep(0.,.5,l))+highTint*smoothstep(.5,1.,l);
        vec2 d=vUv-.5; d.x*=.5625; c*=1.-vig*smoothstep(.2,.75,length(d)*1.25);
        c+= (h(vUv*vec2(1080.,1920.))-.5)*grain; c=mix(c,vec3(1.,.97,.9),flash); c=mix(c,vec3(0.),fade);
        gl_FragColor=vec4(clamp(c,0.,1.),1.); }` });
  composer.addPass(grade);

  // ---------- estado por frame ----------
  const FX = { kicks: [], fovKick: 0 };
  function begin() { for (const k in parts) parts[k].n = 0; smoke.n = 0; glow.n = 0; cannonN = 0; flagN = 0; cannons.forEach(c => c.g.visible = false); flags.forEach(f => f.g.visible = false); rain.visible = false; wheat.visible = false; FX.kicks = []; FX.fovKick = 0; }
  function end() { for (const k in parts) { const p = parts[k]; p.mesh.count = p.n; p.mesh.instanceMatrix.needsUpdate = true; if (p.mesh.instanceColor) p.mesh.instanceColor.needsUpdate = true; }
    for (const L of [smoke, glow]) { L.m.count = L.n; L.m.instanceMatrix.needsUpdate = true; L.data.needsUpdate = true; L.col.needsUpdate = true; } }
  // impulso de cámara: age (s desde el evento), amp, frecuencia
  function kick(age, amp = 1, decay = 5) { if (age >= 0 && age < 3) FX.kicks.push([age, amp, decay]); }
  function fovPunch(age, amt = 6, dur = .35) { if (age >= 0 && age < dur * 3) FX.fovKick += amt * Math.exp(-age / dur) * Math.min(1, age * 30); }

  // look: { top, hor, fog:[near,far], sunDir:[x,y,z], sunCol, sunI, hemiI, hemiSky, hemiGround, exposure, contrast, sat, shadowTint, highTint, cloud, rimI }
  function look(o) { skyU.top.value.set(o.top); skyU.hor.value.set(o.hor); scene.fog.color.set(o.hor); scene.fog.near = o.fog[0]; scene.fog.far = o.fog[1];
    skyU.sunDir.value.set(...o.sunDir).normalize(); skyU.sunCol.value.set(o.sunCol); skyU.cloud.value = o.cloud ?? .5;
    sun.color.set(o.sunCol); sun.intensity = o.sunI; hemi.intensity = o.hemiI; hemi.color.set(o.hemiSky ?? 0xcfd8e6); hemi.groundColor.set(o.hemiGround ?? 0x4a3a26);
    rim.intensity = o.rimI ?? 0; grade.uniforms.exposure.value = o.exposure ?? 1; grade.uniforms.contrast.value = o.contrast ?? 1.08; grade.uniforms.sat.value = o.sat ?? 1.05;
    grade.uniforms.shadowTint.value.set(...(o.shadowTint ?? [0, .03, .06])); grade.uniforms.highTint.value.set(...(o.highTint ?? [.06, .03, -.02]));
    for (const L of [smoke]) { L.m.material.uniforms.fogColor.value.set(o.hor); L.m.material.uniforms.fogNear.value = o.fog[0]; L.m.material.uniforms.fogFar.value = o.fog[1]; L.m.material.uniforms.sunCol.value.set(o.sunCol); L.m.material.uniforms.amb.value.set(o.hemiSky ?? 0x8890a0).multiplyScalar(.75); } }
  function env(o = {}) { sea.visible = !!o.sea; island.visible = !!o.island; farm.visible = o.farm !== false; ground.visible = o.ground !== false; trees.visible = o.ground !== false; groundMat.map = o.mud ? mudTex : grassTex; groundMat.needsUpdate = true; if (o.farmPos) farm.position.set(o.farmPos[0], hgt(o.farmPos[0], o.farmPos[1]), o.farmPos[1]); }

  const tgt = new THREE.Vector3();
  // camera(pos, target, fov, dof{focus, ap}) + shake de impulsos
  function camera(px, py, pz, tx, ty, tz, fov = 34, dof = null, T = 0) {
    const gh = ground.visible ? hgt(tx, tz) : 0; // alturas relativas al terreno bajo el objetivo
    cam.position.set(px, py + gh, pz); tgt.set(tx, ty + gh, tz); cam.lookAt(tgt);
    let sx = 0, sy = 0, sr = 0;
    for (const [age, amp, dec] of FX.kicks) { const e = amp * Math.exp(-age * dec); sx += noise1(T * 31 + age * 9) * e; sy += noise1(T * 37 + 50 + age * 7) * e; sr += noise1(T * 23 + 100) * e; }
    cam.rotateX(sy * 0.035); cam.rotateY(sx * 0.035); cam.rotateZ(sr * 0.02);
    cam.fov = fov - FX.fovKick; cam.updateProjectionMatrix();
    const dist = cam.position.distanceTo(tgt);
    bokeh.enabled = !!dof; if (dof) { bokeh.uniforms.focus.value = dof.focus ?? dist; bokeh.uniforms.aperture.value = dof.ap ?? 0.0006; bokeh.uniforms.maxblur.value = (dof.max ?? 0.01) * .9; bokeh.uniforms.near.value = cam.near; bokeh.uniforms.far.value = cam.far; }
    sun.target.position.copy(tgt); sun.position.copy(tgt).add(skyU.sunDir.value.clone().multiplyScalar(80)); sun.shadow.camera.updateProjectionMatrix();
    rim.target.position.copy(tgt); rim.position.copy(tgt).add(V(-skyU.sunDir.value.x * 50, 25, -skyU.sunDir.value.z * 50));
  }
  function render(T, post = {}) { flagU.t.value = T; grade.uniforms.time.value = Math.floor(T * 30); grade.uniforms.whip.value.set(post.whipX || 0, post.whipY || 0); grade.uniforms.flash.value = post.flash || 0; grade.uniforms.fade.value = post.fade || 0; grade.uniforms.grain.value = post.grain ?? .05; grade.uniforms.vig.value = post.vig ?? .45; grade.uniforms.ca.value = post.ca ?? .0015;
    bloom.strength = post.bloom ?? .35;
    // el RenderPass pinta en readBuffer, que alterna entre frames según cuántos pases hacen swap: leer SU profundidad
    bokeh.uniforms.tDepth.value = composer.readBuffer.depthTexture; composer.render(); }
  function project(x, y, z) { const v = V(x, y, z).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z < 1]; }
  // formación: filas x columnas centradas en cx,cz
  function block(cx, cz, rows, cols, dx, dz, fn) { const out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c; const o = fn(cx + (c - (cols - 1) / 2) * dx + (hash(i * 3.1 + cx) - .5) * 0.22, cz + r * dz + (hash(i * 7.7 + cz) - .5) * 0.22, i, r, c); if (o) out.push(o); } return out; }
  return { passes: { bokeh, bloom, grade, composer }, THREE, renderer, scene, cam, hgt, figure, horse, cannon, flag, puff, dust, spark, muzzle, setRain, setWheat, kick, fovPunch, look, env, camera, render, begin, end, project, block, island, sea, farm, M };
}
