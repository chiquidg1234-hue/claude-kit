// Plantilla: cada plano empieza en una palabra de la narración. Copia patrones de episodios/waterloo/episode.js.
import { hash, clamp01, lerp, ease, easeOut, spring, V } from './engine.js';
export function buildEpisode(E, WORDS) {
  const words = WORDS.words;
  const wt = (line, w, which = 'a') => { const L = words.filter(x => x.line === line); const o = typeof w === 'number' ? L[w] : L.find(x => x.w.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(w)); if (!o) throw new Error('word ' + line + ' ' + w); return o[which]; };
  const lineA = id => WORDS.lines.find(l => l.id === id).a, lineB = id => WORDS.lines.find(l => l.id === id).b;
  const LOOK = { day: { top: 0x5f86b8, hor: 0xd6cdb6, fog: [35, 190], sunDir: [-.6, .55, -.4], sunCol: 0xffe2b8, sunI: 2.6, hemiI: 1.0, cloud: .45 },
    golden: { top: 0x6a7ea0, hor: 0xe8b07a, fog: [30, 170], sunDir: [-.8, .22, -.3], sunCol: 0xffb36a, sunI: 2.8, hemiI: .8, cloud: .5, highTint: [.1, .04, -.03], rimI: .5 } };
  const { figure, block } = E;
  const S = []; const shot = (id, at, o) => S.push(Object.assign({ id, at, trans: 'cut', sfx: [] }, o));
  // 1) gancho: acción desde el frame 0
  shot('hook', 0, { look: 'golden', sfx: [[0, 'boom_soft', .8, 0]], fn: (t, d, T) => { E.env({ farm: false });
    figure({ x: 0, z: 0, ry: 0, team: 'fr', hat: 'shako', armUp: [0, spring(clamp01(t / .5))], t, id: 1 });
    E.camera(1, 1.3, 3, 0, 1.4, 0, 34, { focus: 3, ap: .001 }, T); } });
  // 2) cuerpo: multitud que marcha
  shot('body', lineA('body') - .1, { look: 'day', trans: 'whip', sfx: [[0, 'whoosh', .6, 0], [0, 'march', .8, 0]], fn: (t, d, T) => { E.env({ farm: false });
    block(0, 0, 6, 8, 1.2, -1.3, (x, z, i) => ({ x, z: z + t, ry: 0, team: 'gb', hat: 'shako', musket: 'shoulder', walk: t * 5 + i, amp: .4, t, id: i })).forEach(figure);
    E.camera(2, 2.5, 8 + t, 0, 1, t - 3, 36, null, T); } });
  // 3) pregunta final
  shot('cta', lineA('cta') - .1, { look: 'golden', trans: 'flash', sfx: [[0, 'riser_long', .8, 0]], fn: (t, d, T) => { E.env({ farm: false });
    figure({ x: -1, z: 0, ry: .4, team: 'gb', hat: 'shako', t, id: 1 }); figure({ x: 1, z: 0, ry: -.4, team: 'fr', hat: 'shako', t, id: 2 });
    E.camera(0, 1.6, 5, 0, 1.4, 0, 36, { focus: 5, ap: .0006 }, T); return { vs: true }; } });
  S.forEach((s, i) => { s.end = i + 1 < S.length ? S[i + 1].at : WORDS.total; s.d = s.end - s.at; });
  const MUSIC = [{ a: 0, b: lineA('body'), kind: 'hook', i: .9 }, { a: lineA('body'), b: lineA('cta'), kind: 'battle', i: .8 }, { a: lineA('cta'), b: WORDS.total, kind: 'question', i: .6 }];
  const TITLES = [{ id: 'big', a: wt('hook', 0), b: lineB('hook') + .3, text: 'BIG NUMBER', sub: 'WHAT IT MEANS', subA: wt('hook', 2) }];
  const CTA = { a: lineA('cta') - .1, question: 'WHICH SIDE?', comment: 'TELL ME IN THE COMMENTS', commentAt: lineB('cta') + .2, options: [{ text: 'A', color: '#b3261f', at: lineA('cta') + .5 }, { text: 'B', color: '#23418f', at: lineA('cta') + 1 }] };
  return { shots: S, LOOK, MUSIC, TITLES, CTA, KEY: null };
}
