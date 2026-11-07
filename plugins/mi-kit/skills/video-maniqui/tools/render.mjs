// Render determinista: node render.mjs <episodio> test t1 t2 ... | export | full a b
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs'; import path from 'path';
const [,, ep, mode = 'test', ...args] = process.argv;
// playwright: del NODE_PATH global o de node_modules del episodio (enlace a motor/node_modules)
const { chromium } = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + '/' : path.resolve(ep, 'index.html'))('playwright');
process.chdir(ep);
const port = String(process.env.PORT || 8765);
const srv = spawn('python3', ['-m', 'http.server', port, '--bind', '127.0.0.1'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR', m.text()); });
page.on('pageerror', e => console.log('PAGE EXC', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction('window.ready===true', null, { timeout: 120000 });
const OUT = process.env.OUT || 'frames'; fs.mkdirSync(OUT, { recursive: true });
if (mode === 'export') { fs.writeFileSync('export.json', JSON.stringify(await page.evaluate(() => window.EXPORT()), null, 1)); console.log('export.json'); }
else if (mode === 'test') { for (const t of args) { const t0 = Date.now(); await page.evaluate(x => window.seek(x), +t); await page.screenshot({ path: `${OUT}/test_${t}.jpg`, type: 'jpeg', quality: 85 }); console.log('t', t, Date.now() - t0, 'ms'); } }
else { const w = JSON.parse(fs.readFileSync('words.json')); const fps = 30, N = Math.ceil(w.total * fps); const a = +(args[0] || 0), b = Math.min(N, +(args[1] || N)); const t0 = Date.now();
  for (let f = a; f < b; f++) { const out = `${OUT}/f${String(f).padStart(5, '0')}.jpg`; if (fs.existsSync(out)) continue; await page.evaluate(x => window.seek(x), f / fps); await page.screenshot({ path: out, type: 'jpeg', quality: 92 }); if (f % 30 === 0) console.log(f, '/', b, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } }
await browser.close(); srv.kill();
