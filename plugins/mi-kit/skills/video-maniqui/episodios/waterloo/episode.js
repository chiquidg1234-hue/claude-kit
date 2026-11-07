// Episodio: Waterloo (v2). Planos anclados a palabras de la narración (words.json).
import { hash, clamp01, lerp, ease, easeOut, easeIn, easeInOut, spring, noise1, V } from './engine.js';

export function buildEpisode(E, WORDS) {
  const words = WORDS.words;
  // tiempo de inicio de la palabra n de una línea, o de la primera que empiece por `w`
  const wt = (line, w, which = 'a') => { const L = words.filter(x => x.line === line); const o = typeof w === 'number' ? L[w] : L.find(x => x.w.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(w)); if (!o) throw new Error('word ' + line + ' ' + w); return o[which]; };
  const lineA = (id) => WORDS.lines.find(l => l.id === id).a, lineB = (id) => WORDS.lines.find(l => l.id === id).b;

  const LOOK = {
    day: { top: 0x5f86b8, hor: 0xd6cdb6, fog: [35, 190], sunDir: [-.6, .55, -.4], sunCol: 0xffe2b8, sunI: 2.6, hemiI: 1.0, cloud: .45, exposure: 1.0 },
    smokeDay: { top: 0x8a97a6, hor: 0xc9bea6, fog: [22, 140], sunDir: [-.5, .5, -.5], sunCol: 0xffd9a8, sunI: 2.3, hemiI: 1.0, cloud: .7, exposure: .98, sat: .95 },
    dawn: { top: 0x3c5a86, hor: 0xf0b98a, fog: [30, 170], sunDir: [.2, .12, -1], sunCol: 0xffb070, sunI: 2.4, hemiI: .8, hemiSky: 0xb8c4e0, cloud: .55, exposure: 1.02, highTint: [.09, .03, -.03], rimI: .6 },
    storm: { top: 0x252c38, hor: 0x58606c, fog: [8, 70], sunDir: [0, 1, .2], sunCol: 0x9fb0c8, sunI: .55, hemiI: .9, hemiSky: 0x8d9bb0, cloud: 1, exposure: .95, sat: .7, shadowTint: [0, .03, .07], highTint: [0, .01, .03] },
    golden: { top: 0x6a7ea0, hor: 0xe8b07a, fog: [30, 170], sunDir: [-.8, .22, -.3], sunCol: 0xffb36a, sunI: 2.8, hemiI: .8, cloud: .5, exposure: 1.02, highTint: [.1, .04, -.03], rimI: .5 },
    battle: { top: 0x8a8070, hor: 0xb9a184, fog: [16, 120], sunDir: [-.7, .3, -.5], sunCol: 0xffbd7a, sunI: 2.5, hemiI: .85, cloud: .8, exposure: .98, sat: .92, highTint: [.08, .03, -.03] },
    dusk: { top: 0x2c3550, hor: 0xc07a58, fog: [25, 150], sunDir: [-.9, .07, .2], sunCol: 0xff8a50, sunI: 2.2, hemiI: .55, hemiSky: 0x7080a8, cloud: .6, exposure: 1.0, sat: .9, highTint: [.1, .02, -.02], rimI: .8 },
    night: { top: 0x0c1220, hor: 0x2a3550, fog: [40, 300], sunDir: [.6, .35, -.6], sunCol: 0x9db4e0, sunI: 1.3, hemiI: .35, hemiSky: 0x5068a0, cloud: .35, exposure: 1.05, sat: .8, shadowTint: [0, .02, .08], highTint: [0, .02, .06] },
  };
  const { figure, horse, cannon, flag, puff, dust, spark, muzzle, block, hgt, kick, fovPunch } = E;

  // ---------- planos ----------
  const S = [];
  const shot = (id, at, o) => S.push(Object.assign({ id, at, trans: 'cut', sfx: [] }, o));

  // 1. HOOK: batería disparando ya en el frame 0
  const F1 = [0.32, 1.15, 2.25];
  shot('battery', 0, { look: 'battle', trans: 'cut', sfx: [[F1[0], 'cannon', 1.0, -.2], [F1[1], 'cannon', .85, .3], [F1[2], 'cannon', .7, -.4], [0, 'battle_amb', .5]],
    fn: (t, d, T) => { E.env({ farm: false });
      const ks = [[0, 0, -Math.PI / 2 + .25, F1[0]], [-1.2, -4.5, -Math.PI / 2 + .3, F1[1]], [-2.4, -9, -Math.PI / 2 + .35, F1[2]]];
      ks.forEach(([x, z, ry, f], i) => { cannon({ x, z, ry, fire: [f], t, id: i }); kick(t - f, i === 0 ? 1.6 : .7, 4);
        figure({ x: x + 1.3, z: z + .9, ry: ry + .9, team: 'fr', hat: 'shako', armUp: t - f > -0.4 && t - f < 0.6 ? [.95, .95] : [0, 0], t, id: i * 3 });
        figure({ x: x + 1.6, z: z - 1.1, ry: ry + .5, team: 'fr', hat: 'shako', lean: .1, t, id: i * 3 + 1 }); });
      block(6, -6, 3, 4, 1.25, -1.3, (x, z, i) => ({ x, z, ry: -Math.PI / 2, team: 'fr', hat: 'shako', musket: 'shoulder', t, id: 100 + i })).forEach(figure);
      for (let i = 0; i < 8; i++) puff(-30 - hash(i) * 10, 1.5, -10 + i * 3, 2 + t + hash(i) * 3, 4, 300 + i);
      flag({ team: 'fr', x: -2, z: -6, ry: 0.3 });
      fovPunch(t - F1[0], 5, .3);
      const k = t / d; E.camera(lerp(2.4, 2.0, k), lerp(1.25, 1.35, k), lerp(4.2, 3.6, k), -.4, 1.0, -.3, 38, { ap: .0008 }, T); } });
  // 2. Volea: franceses cayendo en cámara lenta
  shot('falling', wt('hook', 'killed') - 0.1, { look: 'smokeDay', trans: 'whip', sfx: [[0.05, 'volley', 1.0, .2], [0.0, 'whoosh', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); const st = t * 0.42; // cámara lenta
      block(0, 0, 2, 9, 1.15, -1.2, (x, z, i, r) => { const hit = .15 + hash(i * 3.3) * 1.2; const f = r === 0 && hash(i) < .6 ? easeOut((st - hit) / .7) : 0;
        return { x, z, ry: 0, team: 'fr', hat: 'shako', musket: 'charge', walk: st * 5 + i, amp: f > 0 ? 0 : .35, fall: f, fallSide: hash(i) - .5, t: st, id: 200 + i }; }).forEach(figure);
      block(0, 9, 1, 12, 1.0, 1, (x, z, i) => ({ x, z, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'aim', recoil: Math.exp(-Math.max(0, st - .05 - hash(i) * .1) * 6) * (st > .05 ? 1 : 0), t: st, id: 260 + i })).forEach(figure);
      for (let i = 0; i < 12; i++) { const x = (i - 5.5) * 1.0; muzzle(V(x, 1.5, 8.4), V(0, .02, -1), st - .05 - hash(i) * .1, 1, 400 + i); }
      for (let i = 0; i < 8; i++) spark((hash(i) - .5) * 8, .8 + hash(i + 1), -0.2 + hash(i + 2), .12, st > .2 + hash(i) * .6 && st < .3 + hash(i) * .6 ? 2 : 0);
      E.camera(lerp(-7.2, -6.6, t / d), 1.15, lerp(-1.0, -0.8, t / d), 0, 1.0, -0.5, 36, { ap: .0008 }, T); kick(t - .05, .6, 3); } });
  // 3. Aéreo del campo entero
  shot('aerial', wt('hook', 'in') - 0.05, { look: 'battle', trans: 'whip', sfx: [[0, 'whoosh', .7, 0], [0.3, 'cannon_far', .6, -.5], [0.9, 'cannon_far', .5, .5], [1.4, 'volley_far', .5, 0]],
    fn: (t, d, T) => { E.env({ farmPos: [-14, 2] });
      block(0, -12, 6, 22, 1.3, -1.4, (x, z, i) => ({ x, z: z + t * .6, ry: 0, team: 'fr', hat: 'shako', musket: 'port', walk: t * 5 + i, amp: .4, t, id: i })).forEach(figure);
      block(0, 13, 4, 24, 1.2, 1.3, (x, z, i) => ({ x, z, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'shoulder', t, id: 500 + i })).forEach(figure);
      for (let i = 0; i < 6; i++) cannon({ x: -12 + i * 4.5, z: -20, ry: 0, fire: [.3 + hash(i) * 1.5], t, id: 10 + i });
      for (let i = 0; i < 40; i++) puff(-25 + hash(i) * 50, 1, -25 + hash(i + 7) * 55, 1.5 + t + hash(i + 3) * 3, 3, 600 + i);
      const k = easeOut(t / d); E.camera(lerp(3, 6, k), lerp(4, 19, k), lerp(24, 25, k), 0, 0, -3, 40, null, T); } });
  // 4. Título: amanecer, trigo, ejército francés en la cresta
  shot('title', lineA('date') - 0.1, { look: 'dawn', trans: 'flash', sfx: [[0, 'riser_short', .5, 0], [wt('date', 'waterloo') - lineA('date') + 0.1, 'title_hit', 1.0, 0], [0, 'birds', .4, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); E.setWheat(0, 6, 30, 16, T);
      block(0, -8, 3, 20, 1.25, -1.3, (x, z, i) => ({ x, z, ry: 0, team: 'fr', hat: 'shako', musket: 'shoulder', t, id: i })).forEach(figure);
      flag({ team: 'fr', x: -4, z: -9 }); flag({ team: 'fr', x: 5, z: -9 });
      const k = t / d; E.camera(lerp(-2, 1, k), lerp(1.3, 1.9, k), lerp(14, 10, k), 0, 2.2, -8, 36, { ap: .0004 }, T); } });
  // 5. Napoleón primer plano: gira la cabeza a cámara
  shot('napclose', lineA('nap') - 0.15, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .6, 0], [.15, 'boom_soft', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      figure({ x: 0, z: 0, ry: -0.2, team: 'nap', hat: 'bicorne', headY: lerp(-1.0, 0.25, spring(clamp01((t - .25) / 1.2))), t, id: 1, look: 0 });
      block(0, -4, 2, 6, 1.3, -1.3, (x, z, i) => ({ x: x + 1, z, ry: 0, team: 'guard', hat: 'bearskin', musket: 'shoulder', t, id: 10 + i })).forEach(figure);
      flag({ team: 'fr', x: 2.5, z: -3.5, ry: .4 });
      const k = easeOut(t / d); E.camera(lerp(.9, .7, k), 1.72, lerp(2.6, 2.0, k), 0, 1.62, 0, 30, { focus: lerp(2.6, 2.0, k), ap: .0018, max: .014 }, T); } });
  // 6. Vuelve del exilio: el ejército se levanta detrás
  shot('rise', wt('nap', 'exile') - 0.05, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .5, 0], [0.4, 'march', .8, 0], [1.0, 'crowd_cheer', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); const nz = lerp(-3, 1.5, t / d);
      figure({ x: 0, z: nz, ry: 0, team: 'nap', hat: 'bicorne', walk: t * 5, amp: .45, t, id: 1, look: .05 });
      block(0, nz - 3.2, 8, 11, 1.2, -1.35, (x, z, i, r, c) => { const a = spring(clamp01((t - .2 - (r * .2 + Math.abs(c - 5) * .07)) / .8)); return a > .02 ? { x, z, ry: 0, team: 'fr', hat: 'shako', musket: 'shoulder', walk: t * 5 + i, amp: .45, s: Math.max(.01, a), armUp: r > 4 && hash(i) < .3 ? [0, .9] : null, t, id: 20 + i } : null; }).forEach(figure);
      const fa = spring(clamp01((t - .8) / .8)); if (fa > .05) { flag({ team: 'fr', x: -3, z: nz - 5, s: fa }); flag({ team: 'fr', x: 3.5, z: nz - 6, s: fa }); }
      E.camera(lerp(1.8, 1.0, t / d), lerp(1.4, 1.8, t / d), nz + lerp(5.5, 4.4, t / d), 0, 1.5, nz - 2, 36, { ap: .0006 }, T); } });
  // 7. Plano heroico: señala al frente; punch en "win"
  shot('point', wt('nap', 'now') - 0.05, { look: 'golden', trans: 'cut', sfx: [[wt('nap', 'win') - wt('nap', 'now'), 'hit', .9, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); const tw = wt('nap', 'win') - wt('nap', 'now');
      figure({ x: 0, z: 0, ry: 0.3, team: 'nap', hat: 'bicorne', point: spring(clamp01((t - .2) / .5)), headP: -.1, t, id: 1, look: 0 });
      fovPunch(t - tw, 7, .3); kick(t - tw, .5, 6);
      E.camera(.9, .55, 1.5, -.3, 1.6, -.2, 38, { ap: .0012 }, T); } });
  // 8. Wellington a caballo, líneas rojas
  shot('wellington', lineA('rivals') - 0.1, { look: 'day', trans: 'whip', sfx: [[0, 'whoosh', .6, 0], [.3, 'horse_snort', .5, 0], [.1, 'boom_soft', .5, 0]],
    fn: (t, d, T) => { E.env({ farmPos: [-12, -8] });
      horse({ x: 0, z: 0, ry: 0.5, rider: { team: 'well', hat: 'bicorneW', look: .1 }, lean: .05, t, id: 2 });
      block(0, -3.5, 2, 12, 1.15, -1.2, (x, z, i) => ({ x, z, ry: 0, team: 'gb', hat: 'shako', musket: 'shoulder', t, id: 30 + i })).forEach(figure);
      flag({ team: 'gb', x: -3.5, z: -4.5, ry: .2 });
      const a = t * .18; E.camera(Math.sin(a + .7) * 5.2, 1.6, Math.cos(a + .7) * 5.2, 0, 2.0, 0, 34, { ap: .0008 }, T); } });
  // 9. Columna prusiana por un camino entre árboles
  shot('prussians', wt('rivals', 'and') - 0.05, { look: 'day', trans: 'whip', sfx: [[0, 'whoosh', .4, 0], [.7, 'march', .8, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      block(0, 0, 10, 4, 1.15, -1.3, (x, z, i) => ({ x, z: z + t * 1.3, ry: 0, team: 'pr', hat: 'cap', musket: 'shoulder', walk: t * 5.5 + (i % 4) * .2, amp: .42, t, id: 40 + i })).forEach(figure);
      flag({ team: 'pr', x: -1.5, z: -3 + t * 1.3 });
      E.camera(2.2, 1.0, 6.5 + t * .9, 0, 1.4, t * 1.3 - 2, 36, { ap: .0007 }, T); } });
  // 10. Tormenta: rayo en "rained"
  const tRain = wt('rain', 'rained') - lineA('rain') + .1;
  shot('storm', lineA('rain') - 0.1, { look: 'storm', trans: 'whip', sfx: [[0, 'whoosh', .4, 0], [0, 'rain', .9, 0], [tRain, 'thunder', 1.0, 0]],
    fn: (t, d, T) => { E.env({ farm: false, mud: true }); E.setRain(T, 0, 0);
      figure({ x: 0, z: 0, ry: Math.PI + .5, team: 'nap', hat: 'bicorne', headP: -.45, t, id: 1, look: 0 });
      block(0, 4, 3, 7, 1.2, 1.3, (x, z, i) => ({ x, z, ry: Math.PI, team: 'fr', hat: 'shako', musket: 'shoulder', headP: .25, t, id: 50 + i })).forEach(figure);
      const fl = t > tRain ? Math.exp(-(t - tRain) * 6) * (1 + Math.sin((t - tRain) * 60) * .3) : 0;
      E.camera(lerp(1.2, .9, t / d), .9, lerp(-2.8, -2.4, t / d), 0, 1.75, .6, 36, { ap: .0012 }, T);
      return { flash: fl * .55 }; } });
  // 11. Barro: cañón atascado, artilleros empujando; reloj
  shot('mud', wt('rain', 'napoleon') - 0.05, { look: 'storm', trans: 'cut', sfx: [[0, 'rain', .6, 0], [0, 'mud_push', .8, 0], [0, 'clock', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false, mud: true }); E.setRain(T * .7, 0, 0);
      cannon({ x: 0, z: 0, ry: -.6, t: 9, fire: [] });
      [[-.9, -1.1], [.4, -1.5], [-1.6, -.2]].forEach(([x, z], i) => figure({ x, z, ry: -.6, team: 'fr', hat: 'shako', walk: t * 3 + i, amp: .25, lean: .55, armUp: [.4, .4], t, id: 60 + i }));
      E.camera(2.6, .7, 2.2, -.2, .7, -.4, 36, { ap: .0011 }, T);
      return { clock: lerp(6, 11.5, easeInOut(t / d)) }; } });
  // 12. Time-lapse: el sol cruza, sombras barren
  shot('timelapse', wt('rain', 'lost') - 0.05, { look: 'day', trans: 'whip', sfx: [[0, 'whoosh', .5, 0], [0, 'tick_fast', .6, 0]],
    fn: (t, d, T, L) => { E.env({ farmPos: [2, 2] }); const k = t / d;
      L.sunDir = [lerp(.8, -.6, k), lerp(.15, .6, Math.sin(k * Math.PI)), lerp(-.2, -.4, k)]; L.cloud = .6; E.look(L);
      block(-2, -8, 3, 10, 1.25, -1.3, (x, z, i) => ({ x, z, ry: 0, team: 'fr', hat: 'shako', musket: 'shoulder', t, id: 70 + i })).forEach(figure);
      E.camera(14, 9, 16, 0, 0, -2, 38, null, T); return { clockText: k > .55 ? '11:30' : null }; } });
  // 13. Carga de caballería hacia cámara
  shot('charge', lineA('cavalry') - 0.1, { look: 'battle', trans: 'whip', sfx: [[0, 'whoosh', .6, 0], [0, 'hooves', 1.0, 0], [.2, 'charge_yell', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); const st = t * .55;
      for (let i = 0; i < 18; i++) { const r = Math.floor(i / 6), c = i % 6; const z = -14 + st * 9 + r * -2.6 + hash(i) * .8, x = (c - 2.5) * 1.6 + hash(i + 3) * .5;
        horse({ x, z, ry: 0, gallop: st * 11 + i * 1.3, rider: { team: i % 4 ? 'fr' : 'guard', hat: i % 3 ? 'shako' : 'bearskin', ep: true }, sabre: true, lean: .3, t: st, id: 80 + i });
        dust(x, .3, z - .8, (st * 9 + i) % 1.6, 1.2, 900 + i * 7 + Math.floor((st * 9 + i) / 1.6)); }
      kick(0, .25, 0.2);
      E.camera(.6, .35, 2.5, 0, 1.4, -6, 42, { ap: .0006 }, T); } });
  // 14. Cuadro británico rodeado (vista alta orbitando)
  shot('square', wt('cavalry', 'british') - 0.05, { look: 'smokeDay', trans: 'whip', sfx: [[0, 'whoosh', .5, 0], [0, 'hooves', .8, 0], [.2, 'volley', .7, .3], [1.2, 'volley', .6, -.3]],
    fn: (t, d, T) => { E.env({ farmPos: [-22, -12] });
      const n = 7, sp = 1.1; let q = 0; for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) { const off = (i - (n - 1) / 2) * sp, dist = (n * sp) / 2 + r * 1.0; const a = side * Math.PI / 2; const x = Math.cos(a) * dist - Math.sin(a) * off, z = Math.sin(a) * dist + Math.cos(a) * off;
        const ft = r === 1 ? ((t * 1.1 + hash(side * 31 + i)) % 1.8) : 9; q++;
        figure({ x, z, ry: Math.PI / 2 - a, team: 'gb', hat: 'shako', musket: 'aim', kneel: r === 0, recoil: r === 1 ? Math.exp(-ft * 6) : 0, t, id: 100 + q });
        if (r === 1 && hash(q) < .5) muzzle(V(x + Math.cos(a) * 1.3, 1.45, z + Math.sin(a) * 1.3), V(Math.cos(a), 0, Math.sin(a)), ft, .6, 700 + q); }
      flag({ team: 'gb', x: 0, z: 0, s: .9 });
      for (let i = 0; i < 14; i++) { const ang = t * 0.55 + i * (Math.PI * 2 / 14); const bump = Math.max(0, Math.sin(t * 2.2 + i * 1.7)); const rad = 12 - bump * 4;
        horse({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, ry: -ang + (bump > .6 ? Math.PI * .75 : 0) + Math.PI, gallop: t * 9 + i, rider: { team: 'fr', hat: i % 3 ? 'shako' : 'bearskin' }, sabre: true, rear: bump > .8 ? (bump - .8) * 3 : 0, lean: .25, t, id: 150 + i }); }
      const k = t / d; E.camera(Math.cos(k * .9 + .4) * 18, 11 + k * 2, Math.sin(k * .9 + .4) * 18, 0, .5, 0, 36, null, T); } });
  // 15. Dentro del cuadro: bayonetas; caballo encabritado gira
  shot('notone', lineA('cavalry') + (wt('cavalry', 'not') - lineA('cavalry')) - 0.05, { look: 'smokeDay', trans: 'cut', sfx: [[0, 'horse_neigh', .8, .2], [.25, 'hit', .9, 0], [0, 'hooves', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      block(0, 0, 1, 7, .95, 1, (x, z, i) => ({ x, z, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'charge', kneel: true, t, id: 180 + i })).forEach(figure);
      block(0, .9, 1, 7, .95, 1, (x, z, i) => ({ x: x + .45, z, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'aim', t, id: 190 + i })).forEach(figure);
      const rear = Math.max(0, Math.sin(clamp01(t / 1.4) * Math.PI)); horse({ x: .4, z: -3.2 + rear * .3, ry: lerp(0, -2.3, easeInOut((t - .6) / 1.2)), gallop: t > 1.2 ? t * 9 : undefined, rear, rider: { team: 'fr', hat: 'bearskin', ep: true }, sabre: true, t, id: 199 });
      kick(t - .25, .7, 5);
      E.camera(-.6, .9, 2.6, .3, 1.6, -3, 38, { ap: .0009 }, T); return { stamp: t > .3 ? 'NOT ONE BROKE' : null }; } });
  // 16. Mapa aéreo: los prusianos entran por el flanco
  shot('map', lineA('prussia') - 0.1, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .6, 0], [0, 'march', .6, .5], [.4, 'riser_short', .5, 0]],
    fn: (t, d, T) => { E.env({ farmPos: [-30, 30] }); const k = ease(t / d);
      block(-3, -9, 4, 10, 1.3, -1.4, (x, z, i) => ({ x, z: z + t * .8, ry: 0, team: 'fr', hat: 'shako', musket: 'port', walk: t * 5 + i, amp: .4, t, id: i })).forEach(figure);
      block(-3, 9, 2, 12, 1.25, 1.4, (x, z, i) => ({ x, z, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'shoulder', t, id: 100 + i })).forEach(figure);
      const pin = easeOut((t - .1) / (d * .9));
      block(16 - pin * 10, -5, 5, 5, 1.25, -1.4, (x, z, i) => ({ x, z, ry: -Math.PI / 2, team: 'pr', hat: 'cap', musket: 'port', walk: t * 6 + i, amp: .5, t, id: 200 + i })).forEach(figure);
      E.camera(lerp(1, 0, k), lerp(48, 42, k), lerp(19, 16, k), 1, 0, -1, 36, null, T);
      return { arrow: [[[10.5, 1, 1], [8, 1, -2.5], [4, 1, -6]], easeOut((t - .2) / .9), '#f2ebdc'], labels: [{ t: 'PRUSSIANS', p: [Math.min(6.5, 16 - pin * 10), 3, -2.2], c: '#aab0ba', op: easeOut((t - .15) / .4) }, { t: 'FRENCH', p: [-3, 3, -15], c: '#4a6fd8', op: easeOut((t - .3) / .4) }, { t: 'ALLIES', p: [-3, 3, 12.5], c: '#d8443a', op: easeOut((t - .4) / .4) }] }; } });
  // 17. Impacto en el flanco
  const tHit = wt('prussia', 'flank', 'b') - (wt('prussia', 'slammed') - 0.1) + 0.03;
  shot('flank', wt('prussia', 'slammed') - 0.1, { look: 'battle', trans: 'smash', sfx: [[tHit, 'impact', 1.0, 0], [tHit, 'volley', .9, .3], [0, 'battle_amb', .4, 0], [tHit, 'charge_yell', .7, .4]],
    fn: (t, d, T) => { E.env({ farm: false });
      block(2, 0, 6, 4, 1.15, 1.3, (x, z, i) => { const f = hash(i) < .35 ? easeOut((t - tHit - hash(i + 2) * .5) / .5) : 0; return { x, z, ry: -Math.PI / 2 + .3, team: 'fr', hat: 'shako', musket: 'port', fall: f, fallSide: hash(i) - .5, headY: -.6, t, id: 220 + i }; }).forEach(figure);
      block(7 - Math.min(t, .6) * 5, 2, 6, 4, 1.15, 1.3, (x, z, i) => ({ x, z, ry: -Math.PI / 2, team: 'pr', hat: 'cap', musket: 'charge', walk: t * 9 + i, amp: .5, run: true, t, id: 250 + i })).forEach(figure);
      for (let i = 0; i < 10; i++) muzzle(V(4.5 - hash(i) * 1, 1.4, 1 + i * .8), V(-1, 0, 0), t - tHit - hash(i) * .25, .8, 800 + i);
      kick(t - tHit, 1.4, 4); fovPunch(t - tHit, 6, .25);
      E.camera(3.6, 2.2, -4.2, 3.2, 1.2, 3, 38, { ap: .0006 }, T); } });
  // 18. Napoleón ordena
  shot('order', lineA('guard') - 0.1, { look: 'battle', trans: 'whip', sfx: [[0, 'whoosh', .5, 0], [.5, 'boom_soft', .6, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); figure({ x: 0, z: 0, ry: -.4, team: 'nap', hat: 'bicorne', armUp: [0, spring(clamp01((t - .35) / .5)) * .9], headP: -.05, t, id: 1, look: 0 });
      for (let i = 0; i < 10; i++) puff(-8 + i * 2, 1, -10 - hash(i) * 4, 2 + t + hash(i) * 2, 3, 950 + i);
      E.camera(-.8, 1.25, 2.3, 0, 1.55, 0, 32, { ap: .0016, max: .012 }, T); } });
  // 19. La Guardia Imperial (contrapicado heroico)
  shot('guard', wt('guard', 'the') - 0.05, { look: 'golden', trans: 'cut', sfx: [[0, 'drums', 1.0, 0], [0, 'march', .9, 0], [0, 'hit', .7, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      block(0, 0, 7, 6, 1.1, -1.2, (x, z, i) => ({ x, z: z + t * 1.1, ry: 0, team: 'guard', hat: 'bearskin', musket: 'shoulder', walk: t * 4.6 + (i % 6) * .05, amp: .38, t, id: 300 + i })).forEach(figure);
      flag({ team: 'fr', x: .55, z: -1.2 + t * 1.1, s: 1.05 });
      E.camera(.8, .25, 3.2 + t * 1.1 - t * .25, 0, 2.3, t * 1.1 - 1, 40, { ap: .0007 }, T); } });
  // 20. Suben la cresta (vista sobre los británicos)
  shot('ridge', wt('guard', 'they') - 0.05, { look: 'battle', trans: 'whip', sfx: [[0, 'whoosh', .5, 0], [0, 'march', .7, 0], [0, 'drums', .7, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); E.setWheat(0, 3.5, 16, 3, T);
      block(0, -9, 6, 8, 1.15, -1.15, (x, z, i) => ({ x, z: z + t * 1.0, ry: 0, team: 'guard', hat: 'bearskin', musket: 'shoulder', walk: t * 4.5 + i, amp: .35, t, id: 340 + i })).forEach(figure);
      flag({ team: 'fr', x: 0, z: -9.5 + t });
      block(0, 2.6, 1, 10, 1.05, 1, (x, z, i) => ({ x, z, y: hgt(x, z) - .62, ry: Math.PI, team: 'gb', hat: 'shako', musket: 'shoulder', kneel: true, t, id: 400 + i })).forEach(figure);
      E.camera(lerp(2.5, 1.5, t / d), lerp(5.2, 6, t / d), lerp(10.5, 11.5, t / d), 0, .6, -5, 36, { ap: .0004 }, T); } });
  // 21. Muro de fuego: los británicos se levantan y disparan (cámara lenta)
  const tVol = .45;
  shot('wall', wt('guard', 'straight') - 0.05, { look: 'battle', trans: 'cut', sfx: [[tVol * .5 + .1, 'volley_big', 1.0, 0], [tVol * .5, 'impact', .8, 0]],
    fn: (t, d, T) => { E.env({ farm: false }); E.setWheat(0, 3.5, 16, 3, T); const st = t * .5; const rise = easeOut((st - .05) / .2);
      block(0, -3.2, 4, 8, 1.15, -1.15, (x, z, i, r) => { const f = r === 0 && hash(i) < .7 ? easeOut((st - tVol * .5 - .08 - hash(i) * .3) / .5) : 0; return { x, z, ry: 0, team: 'guard', hat: 'bearskin', musket: 'charge', walk: f ? undefined : st * 4.5 + i, amp: .35, fall: f, fallSide: hash(i) - .5, t: st, id: 340 + i }; }).forEach(figure);
      block(0, 2.6, 1, 10, 1.05, 1, (x, z, i) => ({ x, z, y: hgt(x, z) - (1 - rise) * .62, ry: Math.PI, team: 'gb', hat: 'shako', musket: rise > .5 ? 'aim' : 'shoulder', kneel: rise < .5, recoil: st > tVol * .5 ? Math.exp(-(st - tVol * .5) * 8) : 0, t: st, id: 400 + i })).forEach(figure);
      for (let i = 0; i < 10; i++) muzzle(V((i - 4.5) * 1.05, 1.5, 1.95), V(0, .02, -1), st - tVol * .5 - hash(i) * .04, 1.1, 820 + i);
      kick(st - tVol * .5, 1.2, 3);
      E.camera(lerp(-4.5, -4.0, t / d), 1.3, lerp(4.8, 4.4, t / d), -.5, 1.4, -1.5, 36, { ap: .0008 }, T); } });
  // 22. Silencio: un granadero mira alrededor entre el humo
  shot('cry', lineA('cry') - 0.35, { look: 'smokeDay', trans: 'cut', sfx: [[0, 'wind', .6, 0], [0, 'heartbeat', .7, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      figure({ x: 0, z: 0, ry: .3, team: 'guard', hat: 'bearskin', musket: 'port', headY: Math.sin(t * 1.4) * .7, headP: .05, t, id: 345, look: 0 });
      block(0, -1.6, 2, 5, 1.1, -1.2, (x, z, i) => ({ x: x + .5, z, ry: hash(i) * .8 - .4, team: 'guard', hat: 'bearskin', musket: 'port', headY: (hash(i + 3) - .5) * 1.2, t, id: 360 + i })).forEach(figure);
      for (let i = 0; i < 18; i++) puff(-6 + hash(i) * 12, .6 + hash(i + 2) * 1.5, -4 + hash(i + 1) * 7, 1.5 + t * .6 + hash(i + 5) * 2, 2.2, 1000 + i);
      E.camera(lerp(1.3, 1.0, t / d), 1.75, lerp(2.4, 1.8, t / d), 0, 1.65, 0, 32, { focus: lerp(2.5, 1.9, t / d), ap: .002, max: .014 }, T); return { sat: .55 }; } });
  // 23. ¡La Guardia retrocede!
  const tTurn = 0.05;
  shot('retreat', wt('cry', 8) - 0.08, { look: 'battle', trans: 'smash', sfx: [[0, 'payoff', 1.0, 0], [.2, 'crowd_panic', .8, 0], [.3, 'march_run', .8, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      block(0, 0, 6, 8, 1.15, -1.2, (x, z, i) => { const tt = t - tTurn - hash(i) * .5; const rot = easeOut(tt * 3); return { x, z: z - Math.max(0, tt) * 3.2, ry: rot * Math.PI, team: 'guard', hat: 'bearskin', musket: rot > .5 ? 'port' : 'charge', walk: t * 8 + i, amp: .6, run: rot > .5, t, id: 500 + i }; }).forEach(figure);
      for (let i = 0; i < 14; i++) puff(-6 + hash(i) * 12, .5, 2 + hash(i + 1) * 3, 1 + t + hash(i + 5), 2.5, 1100 + i);
      kick(t, 1.5, 3); fovPunch(t, 8, .3);
      E.camera(-.5, 3.2, 7.5 + t * .6, 0, 1, -3 - t * 2, 38, null, T); } });
  // 24. Cuatro días después: Napoleón se aleja al atardecer
  shot('later', lineA('exile') - 0.1, { look: 'dusk', trans: 'flash', sfx: [[0, 'wind', .7, 0], [.1, 'boom_soft', .5, 0]],
    fn: (t, d, T) => { E.env({ farm: false });
      figure({ x: 0, z: -t * .9, ry: Math.PI, team: 'nap', hat: 'bicorne', walk: t * 3.6, amp: .3, lean: .12, headP: .25, t, id: 1, look: 0 });
      for (let i = 0; i < 26; i++) { const x = (hash(i) - .5) * 14, z = -2 - hash(i + 4) * 12; figure({ x, z, ry: hash(i + 2) * 6, team: hash(i + 9) < .5 ? 'fr' : 'gb', hat: 'shako', fall: 1, fallSide: hash(i) - .5, t, id: 600 + i }); }
      flag({ team: 'fr', x: 2.5, z: -4, ry: 1.2, y: hgt(2.5, -4) - 1.4 });
      for (let i = 0; i < 10; i++) puff(-8 + hash(i) * 16, .4, -6 - hash(i + 1) * 10, 2 + t * .5 + hash(i) * 2, 3, 1200 + i);
      E.camera(.6, 1.0, 4.2 - t * .4, 0, 1.2, -t * .9 - 2, 34, { ap: .0008 }, T); } });
  // 25. Santa Elena
  shot('helena', wt('exile', 'he') - 0.05, { look: 'night', trans: 'whip', sfx: [[0, 'whoosh', .4, 0], [0, 'waves', .9, 0]],
    fn: (t, d, T) => { E.env({ sea: true, island: true, farm: false, ground: false }); E.island.position.set(0, -.5, 0);
      figure({ x: 0, y: 2.75, z: 0, ry: -0.6, team: 'nap', hat: 'bicorne', headP: .3, t, id: 1, look: 0 });
      const k = easeOut(t / d); E.camera(lerp(2.2, 9, k), lerp(3.8, 7.5, k), lerp(4, 14, k), 0, lerp(3.9, 3.0, k), 0, 34, { focus: lerp(4.2, 15, k), ap: .0006 }, T); } });
  // 26-29. Pregunta final en 4 planos (sin "dead beats") + vuelta al inicio (loop)
  const duel = (t, d, T, camF) => { E.env({ farm: false });
    horse({ x: -1.6, z: 0, ry: .45, rider: { team: 'well', hat: 'bicorneW' }, t, id: 2 });
    horse({ x: 1.6, z: 0, ry: -.45, rider: { team: 'pr', hat: 'cap', ep: true }, t, id: 3 });
    flag({ team: 'gb', x: -3.4, z: -1.5, ry: .3 }); flag({ team: 'pr', x: 3.4, z: -1.5, ry: -.3 }); camF(t, d); return { vs: true }; };
  shot('cta', lineA('cta') - 0.1, { look: 'golden', trans: 'flash', sfx: [[0, 'boom_soft', .7, 0], [0, 'riser_long', .8, 0]],
    fn: (t, d, T) => duel(t, d, T, (t, d) => E.camera(0, 2.2, lerp(7.5, 7.0, t / d), 0, 2.2, 0, 36, { ap: .0005 }, T)) });
  shot('ctaW', wt('cta', 'wellington') - 0.05, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .5, -.4], [.05, 'hit', .6, -.4]],
    fn: (t, d, T) => duel(t, d, T, (t, d) => E.camera(-.4, 2.5, lerp(2.4, 2.1, t / d), -1.7, 2.45, 0, 32, { ap: .0014 }, T)) });
  shot('ctaB', wt('cta', 'bl') - 0.05, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .5, .4], [.05, 'hit', .6, .4]],
    fn: (t, d, T) => duel(t, d, T, (t, d) => E.camera(.4, 2.5, lerp(2.4, 2.1, t / d), 1.7, 2.45, 0, 32, { ap: .0014 }, T)) });
  shot('ctaVS', lineB('cta') + 0.25, { look: 'golden', trans: 'whip', sfx: [[0, 'whoosh', .5, 0]],
    fn: (t, d, T) => duel(t, d, T, (t, d) => E.camera(0, 3.2, lerp(9, 8.2, t / d), 0, 2.0, 0, 36, null, T)) });
  // cierre: el primer plano otra vez, justo antes del cañonazo (para que el loop empate)
  shot('loop', WORDS.total - 0.55, { look: 'battle', trans: 'whip', sfx: [[0, 'whoosh', .7, 0]], fn: (t, d, T, L) => S[0].fn(-0.55 + t, S[0].d || 4, T, L) });

  S.forEach((s, i) => { s.end = i + 1 < S.length ? S[i + 1].at : WORDS.total; s.d = s.end - s.at; });
  S[0].at = 0;
  // secciones musicales (para el score): intensidad 0..1
  const MUSIC = [
    { a: 0, b: lineA('date') - .1, kind: 'hook', i: .9 },
    { a: lineA('date') - .1, b: lineA('rain') - .1, kind: 'build', i: .55 },
    { a: lineA('rain') - .1, b: lineA('cavalry') - .1, kind: 'tension', i: .45 },
    { a: lineA('cavalry') - .1, b: wt('guard', 'straight') + .4, kind: 'battle', i: .9 },
    { a: wt('guard', 'straight') + .4, b: wt('cry', 8) - .08, kind: 'silence', i: .1 },
    { a: wt('cry', 8) - .08, b: lineA('exile') - .1, kind: 'payoff', i: 1 },
    { a: lineA('exile') - .1, b: lineA('cta') - .1, kind: 'sad', i: .4 },
    { a: lineA('cta') - .1, b: WORDS.total, kind: 'question', i: .6 },
  ];
  // títulos anclados a palabras (id: big | title | kicker | tag)
  const TITLES = [
    { id: 'big', a: 0, b: wt('hook', 'in') - .05, text: '50,000', sub: 'KILLED OR WOUNDED', subA: wt('hook', 'killed') },
    { id: 'big', a: wt('hook', 'in') - .05, b: lineB('hook') + .3, text: '1 DAY', sub: '', subA: 0 },
    { id: 'kicker', a: lineA('date') + .05, b: lineB('date') + .3, text: 'JUNE 18, 1815' },
    { id: 'title', a: wt('date', 'waterloo') - .02, b: lineB('date') + .3, text: 'WATERLOO' },
    { id: 'tag', a: lineA('nap') + .1, b: wt('nap', 'exile') - .05, text: 'NAPOLEON', c: '#4a6fd8' },
    { id: 'tag', a: wt('nap', 'exile'), b: wt('nap', 'now') - .05, text: 'BACK FROM EXILE · 1815', c: '#4a6fd8' },
    { id: 'tag', a: lineA('rivals') + .1, b: wt('rivals', 'and') - .05, text: 'DUKE OF WELLINGTON', c: '#d8443a' },
    { id: 'tag', a: wt('rivals', 'and'), b: lineB('rivals') + .2, text: 'BLÜCHER\'S PRUSSIANS', c: '#9aa0aa' },
    { id: 'tag', a: wt('guard', 'the'), b: wt('guard', 'they') - .05, text: 'THE IMPERIAL GUARD', c: '#4a6fd8' },
    { id: 'title', a: wt('cry', 8) - .05, b: lineB('cry') + .35, text: '«LA GARDE<br>RECULE!»', size: 120, hideCaptions: true },
    { id: 'kicker', a: lineA('exile'), b: wt('exile', 'he') - .05, text: '4 DAYS LATER' },
    { id: 'kicker', a: wt('exile', 'he'), b: lineB('exile') + .3, text: 'SAINT HELENA · 1821' },
  ];
  // pregunta final (genera comentarios): opciones que aparecen en su palabra
  const CTA = { a: lineA('cta') - .1, question: 'WHO REALLY<br>WON?', comment: 'TELL ME IN THE COMMENTS', commentAt: lineB('cta') + .2,
    options: [{ text: 'WELLINGTON', color: '#b3261f', at: wt('cta', 'wellington') }, { text: 'BLÜCHER', color: '#1f2433', at: wt('cta', 'bl') }] };
  // palabras que se resaltan en amarillo aunque ya se hayan dicho
  const KEY = /^(50,000|napoleon|wellington|bl(ü|u)cher|waterloo|1815|imperial|guard|prussians?|british|exile|helena|retreating)/i;
  return { shots: S, LOOK, MUSIC, TITLES, CTA, KEY };
}
