import { createRequire } from 'module'; const { chromium } = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + '/' : import.meta.url)('playwright');
import { spawn } from 'child_process';
import fs from 'fs';
const [,, mode='full', ...times] = process.argv;
const TL = JSON.parse(fs.readFileSync('timeline.json'));
const srv = spawn('python3', ['-m','http.server',String(process.env.PORT||8765),'--bind','127.0.0.1'], {stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page = await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
page.on('console',m=>{if(m.type()==='error')console.log('PAGE ERR',m.text())});
page.on('pageerror',e=>console.log('PAGE EXC',e.message));
await page.goto('http://127.0.0.1:'+(process.env.PORT||8765)+'/index.html');
await page.waitForFunction('window.ready===true',null,{timeout:60000});
fs.mkdirSync('frames',{recursive:true});
if(mode==='test'){
  for(const t of times){const t0=Date.now();await page.evaluate(x=>window.seek(x),+t);await page.screenshot({path:`frames/test_${t}.jpg`,type:'jpeg',quality:85});console.log('t',t,Date.now()-t0,'ms');}
} else {
  const fps=TL.fps,N=Math.ceil(TL.total*fps);const start=+(times[0]||0),end=+(times[1]||N);
  const t0=Date.now();
  for(let f=start;f<end;f++){await page.evaluate(x=>window.seek(x),f/fps);await page.screenshot({path:`frames/f${String(f).padStart(5,'0')}.jpg`,type:'jpeg',quality:90});
    if(f%60===0)console.log(f,'/',N,((Date.now()-t0)/1000).toFixed(0)+'s');}
}
await browser.close();srv.kill();
