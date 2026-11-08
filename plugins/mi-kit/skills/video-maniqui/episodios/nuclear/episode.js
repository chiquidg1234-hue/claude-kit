// What if a nuclear bomb went off 6 miles away? — formato what-if: un solo plano desde un balcón, sin voz.
// Datos (ver INFORME): bomba de 1 Mt en altura (≈3 km), observador a 10 km (6.2 mi).
//  · onda de choque: Glasstone & Dolan (1 Mt a 6,500 ft): ~5.1 km a 11 s, ~15.3 km a 37 s → ~10 km a ~23 s.
//  · quemaduras de 3er grado hasta ~12–13 km (NUKEMAP, 1.2 Mt airburst: 13.2 km). Viento tras el frente ~70 mph a ~2 psi.
//  · bola de fuego ~1 km de radio; nube estabiliza a ~19 km (~12 mi) en ~10 min. ~12,000 cabezas nucleares (FAS 2026: 12,187).
import { hash, clamp01, lerp, ease, easeOut, easeIn, noise1, V } from './engine.js';

export function buildWhatIf(E) {
  const { THREE, scene } = E;
  const K = 70;                                   // unidades de escena por km
  const CAM = V(-6, 11.6, 5.5);
  const GZ = V(50, 0, CAM.z - Math.sqrt(700 * 700 - 56 * 56)); // a 700 u = 10 km del observador
  const BURST = 3.0;                               // km de altura de la explosión
  const TOTAL = 51.5, T_FLASH = 3.0;
  E.cam.far = 6000; E.cam.updateProjectionMatrix(); E.sky.scale.setScalar(6);

  // ---------- reloj del evento: τ (segundos reales desde la detonación) en función del tiempo de vídeo t ----------
  const KEYS = [[0, -3], [3, 0], [6.8, 1.6], [16.5, 19], [21, 23], [25, 24.2], [29, 28.2], [33, 90], [38, 600], [42.5, 1800], [47, 3600], [TOTAL, 3700]];
  const tau = (t) => { for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) { const [a, ta] = KEYS[i - 1], [b, tb] = KEYS[i]; return lerp(ta, tb, (t - a) / (b - a)); } return KEYS.at(-1)[1]; };
  const rate = (t) => (tau(t + .02) - tau(t - .02)) / .04;
  // radio del frente de choque (km) — interpolado de Glasstone & Dolan
  const FR = [[0, 0], [1, .9], [4.6, 2.1], [11, 5.1], [23, 10.0], [37, 15.3], [60, 23.5], [120, 44]];
  const front = (s) => { if (s <= 0) return 0; for (let i = 1; i < FR.length; i++) if (s <= FR[i][0]) { const [a, ra] = FR[i - 1], [b, rb] = FR[i]; return lerp(ra, rb, (s - a) / (b - a)); } return 44 + (s - 120) * .34; };
  const hitTime = (dkm) => { let lo = 0, hi = 200; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (front(m) < dkm) lo = m; else hi = m; } return hi; };
  const dGZ = (x, z) => Math.hypot(x - GZ.x, z - GZ.z) / K;
  const cloudTop = (s) => 3 + 16 * (1 - Math.exp(-Math.max(0, s) / 170));     // km
  const capR = (s) => .9 + 8 * (1 - Math.exp(-Math.max(0, s) / 400));         // km
  const fireR = (s) => s <= 0 ? 0 : .9 * (1 - Math.exp(-s / .35));            // km
  const heat = (s) => s < 0 ? 0 : Math.exp(-s / 2.6);

  // ---------- texturas de fachada ----------
  const tex = (draw, w = 64, h = 64) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const PAL = ['#a9573f', '#d3c09c', '#9ea3a8', '#e2ddd3', '#d8b04f', '#b98a6a'];
  const facade = (wall, broken) => tex((g, w, h) => { g.fillStyle = wall; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 56, w, 8);
    if (!broken) { const gr = g.createLinearGradient(0, 12, 0, 50); gr.addColorStop(0, '#9fb6c9'); gr.addColorStop(1, '#4e6478'); g.fillStyle = gr; g.fillRect(16, 12, 32, 38); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(18, 14, 6, 34); }
    else { g.fillStyle = '#17181a'; g.fillRect(16, 12, 32, 38); g.fillStyle = '#7f93a5'; g.beginPath(); g.moveTo(16, 12); g.lineTo(27, 12); g.lineTo(16, 25); g.fill(); g.beginPath(); g.moveTo(48, 50); g.lineTo(40, 50); g.lineTo(48, 41); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(16, 12, 32, 38); });
  const MAT = PAL.map(c => [new THREE.MeshStandardMaterial({ map: facade(c, false), roughness: .75 }), new THREE.MeshStandardMaterial({ map: facade(c, true), roughness: .9 })]);
  function boxUV(w, h, d) { const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const span = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; if (f === 2 || f === 3) uv.setXY(i, .05, .05); else uv.setXY(i, uv.getX(i) * span[f][0] / 3, uv.getY(i) * span[f][1] / 3.2); } g.translate(0, h / 2, 0); return g; }

  // ---------- suelo, calle, parque ----------
  const add = (m) => { scene.add(m); return m; };
  const flat = (w, d, color, x, y, z, rough = .95) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: rough })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; return add(m); };
  flat(14000, 14000, 0x77766a, 0, -.05, 0);
  flat(14, 200, 0x3a3b3e, 0, 0, -60, .9);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(2.6, .18, 200), new THREE.MeshStandardMaterial({ color: 0xb4b0a8, roughness: .95 })); sw.position.set(s * 8.3, .09, -60); sw.receiveShadow = true; add(sw); }
  for (let z = 0; z > -125; z -= 6) { const m = new THREE.Mesh(new THREE.BoxGeometry(.25, .02, 3), new THREE.MeshStandardMaterial({ color: 0xe8d27a })); m.position.set(0, .01, z); add(m); }
  for (let x = -6; x <= 6; x += 1.4) { const m = new THREE.Mesh(new THREE.BoxGeometry(.8, .02, 3.2), new THREE.MeshStandardMaterial({ color: 0xeeeeea })); m.position.set(x, .012, -22); add(m); }
  flat(500, 180, 0x5f7a42, 0, .01, -215); // parque / río al final de la calle
  flat(500, 26, 0x2d4a5e, 0, .02, -200, .2);

  // ---------- edificios cercanos (con vidrio que se rompe) ----------
  const B = [];
  for (const side of [-1, 1]) { let z = side < 0 ? -2 : 12; let i = 0;
    while (z > -122) { const L = 10 + hash(i * 3.1 + side * 7) * 8; const z1 = z, z0 = z - L; i++;
      if (z0 < -66 && z1 > -58) { z = -66; continue; }               // calle lateral
      const far = -(z0 + z1) / 2; const h = far < 50 ? 16 + hash(i * 5.3 + side) * 20 : far < 90 ? 11 + hash(i * 2.2 + side) * 12 : 7 + hash(i * 9.7 + side) * 7;
      const dep = 14, pal = Math.floor(hash(i * 4.4 + side * 3) * PAL.length);
      const m = new THREE.Mesh(boxUV(dep, h, L - .3), MAT[pal][0]); m.position.set(side * (9.6 + dep / 2), 0, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; add(m);
      const b = { m, pal, side, fx: side * 9.6, z0, z1, h, th: hitTime(dGZ(side * 9.6, (z0 + z1) / 2)), id: B.length };
      if (hash(i * 7.7 + side) < .6) { const aw = new THREE.Mesh(new THREE.BoxGeometry(1.4, .15, L * .6), new THREE.MeshStandardMaterial({ color: [0x8c2b25, 0x2b5a3c, 0x2a3f6e, 0xc9a23a][i % 4], roughness: .8 })); aw.position.set(side * 8.9, 3.4, (z0 + z1) / 2); aw.rotation.z = side * .25; aw.castShadow = true; add(aw); b.aw = aw; }
      B.push(b); z = z0; } }
  // edificio del balcón (detrás de la cámara) + balcón y barandilla
  { const m = new THREE.Mesh(boxUV(14, 30, 16), MAT[1][0]); m.position.set(-16.6, 0, 6); add(m);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(6, .3, 5), new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: .8 })); slab.position.set(-6.6, 10.1, 4.8); add(slab); }
  const rail = new THREE.Group(); { const rm = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .5 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, .09, .09), rm); top.position.set(0, 1.05, 0); rail.add(top);
    for (let k = 0; k <= 12; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.05, .05), rm); b.position.set(-3 + k * .5, .52, 0); rail.add(b); }
    rail.position.set(-6.6, 9.4, 2.9); add(rail); }

  // ---------- ciudad lejana (instanciada) ----------
  const NC = 900; const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), new THREE.MeshStandardMaterial({ roughness: .9 }), NC);
  { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(); let n = 0;
    for (let i = 0; i < NC * 3 && n < NC; i++) { const x = (hash(i * 1.7) - .5) * 1800, z = -300 - hash(i * 2.9) * 1700; if (Math.abs(x) < 260 && z > -330) continue;
      const tower = hash(i * 5.1) < .08 && z > -1000; const h = tower ? 50 + hash(i) * 50 : 6 + hash(i * 3.3) * 28; const w = 12 + hash(i * 4.4) * 20;
      m4.compose(V(x, 0, z), q, V(w, h, 12 + hash(i * 6.6) * 20)); city.setMatrixAt(n, m4); col.set(PAL[i % PAL.length]).multiplyScalar(.75 + hash(i * 8.8) * .3); city.setColorAt(n, col); n++; }
    city.count = n; city.castShadow = false; city.receiveShadow = true; add(city); }

  // ---------- árboles de la calle ----------
  const TR = [];
  for (const side of [-1, 1]) for (let z = -14; z > -112; z -= 12) { if (z < -56 && z > -68) continue; const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, 3, 6), new THREE.MeshStandardMaterial({ color: 0x5a4430 })); trunk.position.y = 1.5; g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), new THREE.MeshStandardMaterial({ color: 0x4e7034, roughness: 1, flatShading: true })); crown.position.y = 3.9; crown.scale.set(1, 1.15, 1); g.add(crown);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.position.set(side * 7.6, .18, z); add(g); TR.push({ g, crown, th: hitTime(dGZ(side * 7.6, z)), id: TR.length }); }

  // ---------- coches ----------
  const CARC = [0xb3261f, 0xe8e6e0, 0x23418f, 0x2a2a2a, 0xd9a92a, 0x6d7378, 0x2f6e4a, 0xc9c4b8, 0xe07a2a, 0x3b3f6a];
  const CARS = CARC.map((c, i) => { const g = new THREE.Group(); const pm = new THREE.MeshStandardMaterial({ color: c, roughness: .35, metalness: .3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, .7, 4.2), pm); body.position.y = .65; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, .6, 2.2), new THREE.MeshStandardMaterial({ color: 0x334455, roughness: .15, metalness: .5 })); cab.position.set(0, 1.25, -.2); g.add(cab);
    for (const [x, z] of [[-.85, 1.3], [.85, 1.3], [-.85, -1.3], [.85, -1.3]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .25, 12), new THREE.MeshStandardMaterial({ color: 0x151515 })); w.rotation.z = Math.PI / 2; w.position.set(x, .33, z); g.add(w); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); add(g);
    const lane = i % 2 ? 3.3 : -3.3, dir = lane > 0 ? -1 : 1, v = 6 + hash(i * 3) * 3; const zs = -18 - hash(i * 7.3) * 85;
    return { g, lane, dir, v, zs, react: .5 + hash(i * 1.9) * 1.2, th: 0, id: i }; });

  // ---------- gente ----------
  const COAT = [0x2f4a7a, 0xb8423a, 0xe0c35a, 0x3e7d5a, 0x232323, 0xd8d8d8, 0x8a5a9a, 0xe07a3a, 0x5a7fb0, 0x9c6b3e].map(c => new THREE.Color(c));
  const LEGS = [0x2a3550, 0x1e1e1e, 0x6b6e74, 0xc8b89a, 0x3a3a3a].map(c => new THREE.Color(c));
  const P = [];
  for (let i = 0; i < 74; i++) { const h = (k) => hash(i * 13.37 + k);
    const cross = h(1) < .18; const side = h(2) < .5 ? -1 : 1;
    const p = { id: i, colors: { coat: COAT[i % COAT.length], legs: LEGS[(i * 7) % LEGS.length], belt: null }, cross,
      x: cross ? -6 + h(3) * 12 : side * (7.4 + h(3) * 1.4), z: cross ? -22 + (h(4) - .5) * 2.4 : -14 - h(4) * 64,
      dir: h(5) < .5 ? 1 : -1, v: 1.1 + h(6) * .5, react: .12 + h(7) * .45, turn: 1.0 + h(8) * 2.6, mode: h(9) < .45 ? 'crouch' : h(9) < .8 ? 'run' : 'stand',
      runAt: 2 + h(10) * 5, fs: (h(11) - .5) * 2, rec: h(12) < .55, recAt: 150 + h(13) * 900, s: .92 + h(14) * .14 };
    p.th = hitTime(dGZ(p.x, p.z)); P.push(p); }
  function person(p, s, T) { let x = p.x, z = p.z, ry = p.cross ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (p.dir > 0 ? 0 : Math.PI);
    const tw = Math.min(s, p.react); const walkD = p.v * (tw + 3); // camina 3 s antes de la detonación
    if (p.cross) x += p.dir * walkD - p.dir * p.v * 3; else z += p.dir * walkD - p.dir * p.v * 3;
    let walk = s < p.react ? (s + 3) * p.v * 3.2 + p.id : undefined, armUp = [0, 0], kneel = false, run = false, lean = 0, headP = 0;
    const face = Math.atan2(GZ.x - x, GZ.z - z);                       // mirar hacia la explosión
    if (s >= p.react) { const k = ease((s - p.react) / .35); ry = lerp(ry, face, k); armUp = [.75 * k, .8 * k]; headP = -.1 * k; }
    if (s >= p.react + p.turn) { const k = ease((s - p.react - p.turn) / .4); ry = lerp(face, face + Math.PI + p.fs * .3, k); armUp = [.75 * (1 - k) + .95 * k, .8 * (1 - k) + .95 * k];
      if (p.mode === 'crouch') kneel = k > .5;
      if (p.mode === 'run' && s > p.runAt) { const dr = Math.min(s, p.th) - p.runAt; z = Math.min(-9, z + dr * 3.4); x = lerp(x, Math.sign(x || 1) * 8.3, clamp01(dr / 2)); run = true; walk = dr * 9 + p.id; armUp = [0, 0]; ry = 0; }
      if (p.mode === 'stand') { headP = .35 * k; } }
    let fall = 0;
    if (s >= p.th) { const a = s - p.th; fall = easeOut(a / .45); z += (kneel ? 1.2 : 3.2) * easeOut(a / .8); x += p.fs * .6 * easeOut(a / .8); walk = undefined; run = false; armUp = [.9, .9]; kneel = false;
      if (p.rec && s > p.th + p.recAt) { const k = ease((s - p.th - p.recAt) / 40); fall = 1 - k; kneel = k > .4 && k < .95; headP = .4; armUp = [0, 0]; } }
    E.figure({ x, z, y: p.cross ? 0 : .18, ry, s: p.s, colors: p.colors, walk, amp: .5, run, kneel, fall, fallSide: p.fs, fallBack: Math.cos(ry) < 0, armUp, headP, lean, t: T, id: p.id }); }

  // ---------- bola de fuego ----------
  const fireU = { heat: { value: 1 }, time: { value: 0 }, op: { value: 1 } };
  const fireball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({ uniforms: fireU, transparent: true, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normalMatrix*normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float heat,time,op; varying vec3 vN; varying vec3 vP;
      float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);} float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){ float f=n(vP*3.+time*.6)*.6+n(vP*7.-time)*.4; float rim=pow(1.-abs(dot(normalize(vN),vec3(0,0,1))),2.);
        vec3 hot=vec3(9.,8.5,7.5), mid=vec3(6.,2.6,.7), cool=vec3(1.6,.35,.08);
        vec3 c = heat>.5 ? mix(mid,hot,(heat-.5)*2.) : mix(cool,mid,heat*2.);
        c *= .75+.55*f; c = mix(c, c*.35, rim*(1.-heat)); gl_FragColor=vec4(c, op); }` }));
  fireball.renderOrder = 9; add(fireball);

  // ---------- look por τ ----------
  const C = (h) => new THREE.Color(h); const mixHex = (a, b, k) => C(a).lerp(C(b), clamp01(k)).getHex();
  const fbDir = () => V(GZ.x - CAM.x, BURST * K, GZ.z - CAM.z).normalize();
  function lookAt(s) { const hh = heat(s); const dusty = clamp01((s - 22.5) / 3), smoky = clamp01((s - 200) / 900);
    const L = { top: 0x6d95c6, hor: 0xdcd6c8, fog: [160, 2600], sunDir: [.45, .62, .5], sunCol: 0xfff0dc, sunI: 2.5, hemiI: 1.0, cloud: .25, exposure: 1, contrast: 1.06, sat: 1.05, highTint: [.05, .03, -.01] };
    if (s >= 0) { const d = fbDir(); const k = hh; L.sunDir = k > .02 ? [lerp(.45, d.x, k), lerp(.62, d.y, k), lerp(.5, d.z, k)] : L.sunDir; L.sunCol = mixHex(0xfff0dc, 0xffe2b0, k); L.sunI = 2.5 + 26 * k; L.exposure = 1 + .45 * k;
      L.top = mixHex(0x6d95c6, 0xf3d6a8, k); L.hor = mixHex(0xdcd6c8, 0xfff0d0, k); if (s > 4) L.hor = mixHex(L.hor, 0xe9c8a2, clamp01((s - 4) / 8) * (1 - dusty)); }
    if (dusty > 0) { L.top = mixHex(L.top, 0x7d7a76, dusty); L.hor = mixHex(L.hor, 0xb49a7d, dusty); L.fog = [lerp(160, 45, dusty), lerp(2600, 1700, dusty)]; L.sunI = lerp(L.sunI, 1.5, dusty); L.hemiI = lerp(1, .8, dusty); L.sat = lerp(1.05, .88, dusty); L.contrast = 1.1; L.cloud = 0; }
    if (smoky > 0) { L.top = mixHex(L.top, 0x463f40, smoky); L.hor = mixHex(L.hor, 0x9c7656, smoky); L.sunI = lerp(L.sunI, .9, smoky); L.hemiI = lerp(L.hemiI, .62, smoky); L.fog = [45, lerp(1700, 1400, smoky)]; L.highTint = [.1, .03, -.04]; }
    return L; }

  // ---------- escena por frame ----------
  const fireSpots = []; for (let i = 0; i < 14; i++) { const b = B[Math.floor(hash(i * 3.3) * B.length)]; fireSpots.push({ x: b.fx + b.side * (.2 + hash(i) * .4), y: 3 + hash(i * 2.1) * Math.max(1, b.h - 4), z: lerp(b.z0, b.z1, hash(i * 5.5)), at: 2 + hash(i * 7.1) * 300, id: i }); }
  for (let i = 0; i < 26; i++) fireSpots.push({ x: (hash(i * 9.1) - .5) * 900, y: 8 + hash(i * 3.7) * 20, z: -330 - hash(i * 4.9) * 900, at: 1 + hash(i * 1.3) * 60, id: 100 + i, far: true });

  function scene_(t) {
    const s = tau(t), T = t; E.env({ ground: false, farm: false, sea: false, island: false });
    const L = lookAt(s); E.look(L);
    // cámara: en mano (balcón), sacudida al llegar la onda, sube para seguir la nube
    const sCam = hitTime(10.0); for (const k of [0, .35, .9]) E.kick(s - sCam - k, k ? 1.2 : 3.2, 2.2);
    if (s > 0 && s < 1.5) E.kick(s * 2, .25, 4);
    const tilt = ease((t - 30.5) / 4.5) * 20 - ease((t - 40) / 4) * 6; const pitch = (4 + tilt) * Math.PI / 180;
    const hand = (k) => noise1(T * .45 + k) * .05;
    E.camera(CAM.x + hand(1), CAM.y + hand(2), CAM.z, CAM.x + 6 + hand(3) * 3, CAM.y + Math.tan(pitch) * 41, CAM.z - 41, 62, null, T);
    // barandilla vibra con la onda
    rail.position.y = 9.4 + (s > sCam ? Math.sin((s - sCam) * 60) * .02 * Math.exp(-(s - sCam) * 2) : 0);
    // edificios: vidrio roto cuando pasa el frente
    for (const b of B) b.m.material = MAT[b.pal][s >= b.th ? 1 : 0];
    for (const b of B) if (b.aw) { const a = s - b.th; b.aw.rotation.z = b.side * (.25 + (a > 0 ? Math.min(1.1, a * 3) : 0)); }
    // árboles
    for (const tr of TR) { const a = s - tr.th; let bend = Math.sin(T * 1.3 + tr.id) * .015;
      if (a > 0) bend += .55 * easeOut(a / .25) * Math.exp(-a / 2.2) + .12 * Math.exp(-a / 25);
      bend -= .1 * ease((s - 32) / 10) * Math.exp(-Math.max(0, s - 60) / 200);
      tr.g.rotation.x = bend; tr.crown.material.color.setHex(mixHex(0x4e7034, 0x6b5a2e, clamp01(s / 8) * .7)); tr.crown.scale.setScalar(a > 0 ? lerp(1, .55, easeOut(a / 1.5)) : 1); tr.crown.scale.y *= 1.15;
      if (s > .3 && s < 14) for (let k = 0; k < 2; k++) E.puff(tr.g.position.x, 4.4, tr.g.position.z, (s - .3 - k * 2) % 6, .35, tr.id * 5 + k, [.5, .48, .45], 6); }
    // coches
    for (const c of CARS) { const brake = Math.max(0, s - c.react); const run = Math.min(s, c.react) + 3; let dz = c.dir * (c.v * run + (brake > 0 ? Math.min(c.v * brake - 3 * brake * brake, c.v * c.v / 12) : 0)) - c.dir * c.v * 3;
      let z = c.zs + dz, x = c.lane, yaw = c.dir > 0 ? 0 : Math.PI; c.th = hitTime(dGZ(x, z));
      if (s > c.th) { const a = easeOut((s - c.th) / .9); z += (2 + hash(c.id) * 3) * a; yaw += (hash(c.id * 3) - .5) * .8 * a; x += (hash(c.id * 5) - .5) * 1.2 * a; }
      c.g.position.set(x, 0, z); c.g.rotation.y = yaw;
      if (s > c.th + .5 && Math.floor(T * 3 + c.id) % 2 === 0) for (const sx of [-.8, .8]) for (const sz of [-2.1, 2.1]) E.spark(x + sx * Math.cos(yaw) + sz * Math.sin(yaw), .75, z + sz * Math.cos(yaw) - sx * Math.sin(yaw), .5, 1.4, 2.2, 1.2, .3); }
    // gente
    for (const p of P) person(p, s, T);
    // bola de fuego → nube
    const top = cloudTop(s) * K, rF = fireR(s) * K, rC = capR(s) * K; const cx = GZ.x, cz = GZ.z; const cy = Math.max(BURST * K, top - rC * .45);
    fireball.visible = s >= 0 && s < 40; if (fireball.visible) { fireball.position.set(cx, cy, cz); fireball.scale.setScalar(Math.max(rF, .01) * (1 + .15 * clamp01(s / 20))); fireU.heat.value = Math.exp(-s / 9); fireU.time.value = T; fireU.op.value = 1 - clamp01((s - 18) / 18); }
    const hh = heat(s);
    if (s >= 0) { E.glowAt(cx, cy, cz, rF * 7 + 40, 2.2 * hh + .25 * Math.exp(-s / 15), 2.4, 1.6, 1.0); }
    if (s > 2) { const N = 240, form = clamp01((s - 2) / 14), glowK = Math.exp(-s / 22);
      for (let i = 0; i < N; i++) { const a = hash(i * 1.37) * Math.PI * 2, rr = Math.sqrt(hash(i * 2.71)) * rC * 1.05, yy = (hash(i * 3.9) - .45) * rC * .55 * (1 - .5 * rr / rC);
        const sp = .9 + .2 * noise1(i + s * .02); const x = cx + Math.cos(a + s * .002) * rr * sp, z = cz + Math.sin(a + s * .002) * rr * .75 * sp, y = cy + yy + (rr / rC) * rC * .1 - rC * .05;
        const inner = 1 - rr / (rC * 1.05); const und = clamp01(.5 - yy / (rC * .55)); const col = [lerp(lerp(.62, .36, und), 2.2, glowK * inner), lerp(lerp(.55, .31, und), .8, glowK * inner), lerp(lerp(.5, .28, und), .32, glowK * inner)];
        E.smokeAt(x, y, z, rC * (.55 + hash(i * 5.3) * .5), .55 * form, hash(i) * 6 + s * .01, hash(i * 9.1), col[0], col[1], col[2]); }
      // tallo (polvo aspirado)
      if (s > 9) { const st = clamp01((s - 9) / 40), w = lerp(.25, 1.6, clamp01((s - 9) / 400)) * K; const yTop = cy - rC * .3;
        for (let i = 0; i < 110; i++) { const k = hash(i * 4.1); if (k > st * 1.05) continue; const y = k * yTop; const a = hash(i * 6.2) * Math.PI * 2, rr = Math.sqrt(hash(i * 8.3)) * w * (1 + .4 * (1 - k));
          E.smokeAt(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr * .8, w * (1.1 + hash(i) * .6), .45, hash(i * 2) * 6, hash(i * 3.3), .46, .39, .33); } } }
    // muro de polvo: el frente de choque avanzando hacia la cámara
    const r = front(s) * K, dCam = 700;
    if (s > 0 && r > dCam - 420 && r < dCam + 6) { const th0 = Math.atan2(CAM.z - GZ.z, CAM.x - GZ.x);
      for (let i = 0; i < 190; i++) { const a = th0 + (hash(i * 2.3) - .5) * .2, back = hash(i * 3.7) * 26, rr = r - back; const x = GZ.x + Math.cos(a) * rr, z = GZ.z + Math.sin(a) * rr;
        const y = hash(i * 5.9) * lerp(16, 30, hash(i)) * (1 - back / 34); E.smokeAt(x, y, z, 7 + hash(i * 7.1) * 10, .75 * (1 - back / 30) * clamp01((dCam - r + 4) / 40) ** .5, hash(i) * 6 + s, hash(i * 1.1), .66, .58, .48); } }
    // polvo en el aire tras el paso (viento del frente y luego viento inverso)
    if (s > sCam - 2) { const age = s - sCam; const k = clamp01((age + 2) / 1.5) * (1 - clamp01((s - 400) / 1400) * .6);
      for (let i = 0; i < 80; i++) { let x = -16 + hash(i * 1.9) * 32, z = 10 - hash(i * 2.8) * 110, y = 2 + hash(i * 3.6) * 22;
        const push = age < 0 ? 0 : Math.min(age, 4) * 9 + Math.max(0, Math.min(age, 30) - 4) * 1.2, back = Math.max(0, s - 30) * .9; z = ((z + push - back) % 120 + 120) % 120 - 110; x += noise1(i + s * .3) * 2;
        if (z > -12) continue; E.smokeAt(x, y, z, 4 + hash(i * 4.7) * 5, .07 * k, hash(i) * 6 + s * .05, hash(i * 6.1), .62, .55, .47); } }
    // vidrio: destellos que vuelan desde las fachadas al pasar el frente
    for (const b of B) { const a = s - b.th; if (a < 0 || a > 2.6) continue;
      for (let k = 0; k < 16; k++) { const hz = hash(b.id * 31 + k), hy = hash(b.id * 17 + k * 3); const vx = -b.side * (1.5 + hash(k + b.id) * 4), vz = 8 + hash(k * 7 + b.id) * 12, vy = 1 + hash(k * 3.3) * 3;
        const y0 = 3 + hy * (b.h - 3), y = y0 + vy * a - 4.9 * a * a; if (y < .05) continue;
        E.glowAt(b.fx + vx * a, y, lerp(b.z0, b.z1, hz) + vz * a, .22, 1.4 * (1 - a / 2.6), 1.5, 1.6, 1.7); }
      if (a < 1.5) for (let k = 0; k < 3; k++) E.dust(b.fx - b.side * .5, 3 + k * b.h / 4, (b.z0 + b.z1) / 2, a * 1.3, 2.2, b.id * 9 + k); }
    { const a = s - sCam + .25; if (a > 0 && a < 1.6) for (let k = 0; k < 70; k++) { const z = -14 + a * (16 + hash(k) * 14), y = 8 + hash(k * 2.2) * 7 - 3 * a * a, x = CAM.x + 2 + (hash(k * 3.1) - .5) * 12; if (z < CAM.z + 1) E.glowAt(x, y, z, .06 + hash(k * 4) * .08, 1.6, 1.5, 1.6, 1.7); } }
    // calor: humo de toldos y fuegos que crecen
    for (const f of fireSpots) { const a = s - f.at; if (a < 0) continue; const g = clamp01(a / (f.far ? 120 : 60)) * (f.far ? 1 : .8); const fl = .7 + .3 * noise1(T * 8 + f.id);
      const sz = f.far ? 8 + 22 * g : .5 + 1.2 * g; E.glowAt(f.x, f.y, f.z, sz * 1.4, (f.far ? 1.0 : .8) * fl * Math.min(1, a * 2), 2.4, 1.1, .35);
      const life = f.far ? 40 : 8, n = f.far ? 6 : 3; for (let k = 0; k < n; k++) { const age = ((T * (f.far ? 3 : 1) + k * life / n + f.id) % life); E.smokeAt(f.x + age * (f.far ? 1.5 : .3), f.y + age * (f.far ? 6 : 1.2) * (1 + g), f.z, (f.far ? 20 + age * 2.5 : 1.5 + age * .6) * (.5 + g), .35 * (1 - age / life) * clamp01(a), f.id + k, hash(f.id * 3 + k), .22, .2, .2); } }
    // destello: blanco total y vuelta
    let flash = 0; if (s >= 0) flash = s < .1 ? 1 : Math.max(0, 1 - (s - .1) / .55) ** 2;
    const fade = clamp01((t - 46.4) / .6);
    return { flash, fade, bloom: .45 + 1.6 * hh, hideText: false, vig: .5 + .15 * clamp01((s - 23) / 5) }; }

  // ---------- HUD ----------
  const fmt = (x) => { x = Math.max(0, x); const m = Math.floor(x / 60), sec = x - m * 60; return x < 60 ? `${m}:${sec.toFixed(3).padStart(6, '0')}` : `${m}:${String(Math.floor(sec)).padStart(2, '0')}`; };
  const hud = (t) => { const s = tau(t); const r = rate(t); const sub = s < 0 ? '1 MEGATON · 6 MILES AWAY' : r > 1.15 ? `TIME SPED UP ${r < 10 ? r.toFixed(1) : Math.round(r)}×` : r < .87 ? `TIME SLOWED DOWN ${(1 / r).toFixed(1)}×` : 'REAL TIME';
    let extra = ''; const sCam = hitTime(10.0);
    if (s >= 12 && s < sCam) extra = `BLAST ARRIVES IN ${(sCam - s).toFixed(1)} s`;
    else if (s >= sCam && s < sCam + 6) extra = `WIND ${Math.round(70 * Math.exp(-(s - sCam) / 2.5) + 8)} MPH`;
    else if (s >= 30 && s < 90) extra = 'WIND REVERSED · TOWARD THE FIRE';
    else if (s >= 90) extra = `CLOUD TOP ${(cloudTop(s) / 1.609).toFixed(1)} MILES`;
    if (t >= 46.4) return null;
    return s < 0 ? { label: 'Detonation in', value: fmt(-s), sub } : { label: 'Time since detonation', value: fmt(s), sub, extra }; };

  const captions = [
    [0.4, 2.9, "You're on a balcony, 6 miles away."],
    [3.4, 6.4, 'The flash arrives first. At the speed of light.'],
    [6.8, 10.2, 'The heat pulse lasts about ten seconds.'],
    [10.6, 14.0, 'Exposed skin burns, even out here.'],
    [14.4, 17.6, "Then silence. The blast hasn't arrived yet."],
    [18.0, 20.8, 'You can see it coming.'],
    [21.3, 24.6, 'Every window in the city breaks at once.'],
    [25.0, 28.6, 'Flying glass is the deadliest thing out here.'],
    [29.0, 32.6, 'Then the wind reverses, back toward the fireball.'],
    [33.0, 37.4, 'The cloud climbs 12 miles into the sky.'],
    [37.8, 42.0, 'Fires start wherever the heat touched.'],
    [42.6, 46.2, 'And this was just one bomb.'],
  ].map(([a, b, text]) => ({ a, b, text }));
  const tImpact = 21.0;
  const music = [{ a: 0, b: T_FLASH, kind: 'calm', i: .6, gain: .5 }, { a: T_FLASH, b: 14.4, kind: 'drone', i: .6, gain: .9 }, { a: 14.4, b: tImpact, kind: 'dread', i: .7, gain: 1 },
    { a: 29, b: 46.6, kind: 'sad', i: .7, gain: .3 }, { a: 47, b: TOTAL, kind: 'end', i: .6, gain: .35 }];
  const cues = [[0, 'city_amb', .6, 0, T_FLASH], [0, 'birds', .3, 0, T_FLASH], [T_FLASH, 'nuke_flash', 1, 0], [T_FLASH + .3, 'heat_roar', .9, 0, 14.4],
    [4.2, 'crowd_panic', .5, 0, 8], [14.4, 'heartbeat', .8, 0, tImpact], [17.6, 'riser_long', .9, 0, tImpact], [tImpact - .05, 'whoosh', 1, 0],
    [tImpact, 'blast', 2.6, 0], [tImpact + .05, 'glass', 1.6, 0, tImpact + 3], [tImpact, 'storm_wind', 1, 0, 29], [tImpact + .4, 'debris', .9, 0, 26],
    [22.6, 'car_alarm', .5, -.4, 33], [23.4, 'car_alarm', .4, .5, 31], [25.2, 'crowd_panic', .45, 0, 28], [29, 'wind', .45, 0, 33.5],
    [33, 'siren', .3, .3, 46.4], [37.8, 'fire', .5, 0, 46.4], [46.4, 'boom_soft', .6, 0], [47, 'end_tone', .7, 0, TOTAL]];
  return { total: TOTAL, accent: '#ffb35c', title: { a: 0, b: 2.9, text: 'What if a <em>nuclear bomb</em> went off 6 miles away?' }, captions, hud,
    end: { a: 47, text: 'What if a <em>nuclear bomb</em> went off 6 miles away?', sub: 'There are about 12,000 nuclear warheads on Earth today.' },
    scene: scene_, music, cues, tau, hitTime };
}
