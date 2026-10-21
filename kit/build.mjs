// Uso: node build.mjs <spec.json> <pastaSaida>
// Gera <pastaSaida>/<id>.mp4 (1080x1920, 30 fps, sem som) e <pastaSaida>/<id>-capa.png. Falha (exit 2) se algum texto sair da área segura.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
function loadPlaywright() {
  for (const base of [here + '/', '/opt/npm-tools/node_modules/', process.cwd() + '/']) {
    try { return createRequire(base)('playwright'); } catch {}
  }
  throw new Error('playwright não encontrado (npm i playwright)');
}
const { chromium } = loadPlaywright();
const [specPath, outDir] = [process.argv[2], process.argv[3]];
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const FPS = 30, W = 1080, H = 1920, SAFE_TOP = 250, SAFE_BOT = 1670, MAXW = 1034;
fs.mkdirSync(outDir, { recursive: true });
const framesDir = path.join(outDir, '_frames_' + spec.id);
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await chromium.launch();
async function open(file) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.addInitScript((s) => { window.__SPEC = s; }, spec);
  page.on('pageerror', (e) => { console.error('ERRO NA PÁGINA:', e.message); process.exitCode = 3; });
  await page.goto(pathToFileURL(path.join(here, file)).href);
  await page.evaluate(() => Promise.all([
    document.fonts.load('700 20px Montserrat'), document.fonts.load('600 20px Montserrat'),
    document.fonts.load('400 20px Inter'), document.fonts.load('600 20px Inter'), document.fonts.load('700 20px Inter'),
  ]));
  return page;
}

// ---------- capa ----------
const cp = await open('cover.html');
const problems = [];
const crects = await cp.evaluate(() => {
  const o = {};
  for (const id of ['eyebrow', 'h1', 'sub', 'ctaT']) {
    const r = document.createRange(); r.selectNodeContents(document.getElementById(id));
    const b = r.getBoundingClientRect();
    o[id] = { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
  }
  return o;
});
for (const [k, b] of Object.entries(crects)) {
  if (b.top < SAFE_TOP || b.bottom > SAFE_BOT || b.right > MAXW) problems.push(`capa ${k}: ${JSON.stringify(b)}`);
}
const coverPath = path.join(outDir, spec.id + '-capa.png');
await cp.screenshot({ path: coverPath, type: 'png' });
await cp.close();

// ---------- vídeo ----------
const probe = await open('engine.html');
const dur = await probe.evaluate(() => window.__DURATION);
if (dur > 58) problems.push(`vídeo longo demais: ${dur.toFixed(1)} s (máx. 58)`);
const caps = await probe.evaluate(() => window.__CAPTIONS);
const times = [];
for (const c of caps) times.push(c.a + 1.2);
times.push(dur - 3, dur - 8);
for (const t of times) {
  const r = await probe.evaluate((tt) => {
    window.__render(tt);
    const o = {};
    for (const id of ['badge', 'capTitle', 'capSub', 'oT1', 'oT2', 'oS2']) {
      const e = document.getElementById(id);
      const range = document.createRange(); range.selectNodeContents(e);
      const b = range.getBoundingClientRect();
      const vis = e.offsetParent !== null || id.startsWith('cap') || id === 'badge';
      o[id] = { top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width };
    }
    return o;
  }, t);
  for (const id of ['badge', 'capTitle', 'capSub']) {
    const b = r[id];
    if (b.w > 0 && (b.top < SAFE_TOP || b.bottom > SAFE_BOT || b.right > MAXW)) problems.push(`t=${t.toFixed(1)} ${id}: ${JSON.stringify(b)}`);
  }
}
await probe.close();
console.log('duração', dur.toFixed(2), 's; problemas:', problems.length);
if (problems.length) { console.error(problems.join('\n')); await browser.close(); process.exit(2); }

if (process.env.DRY) {
  const pg = await open('engine.html');
  for (const [i, t] of [6, 12, 16, 20, 26, 32, 38, dur - 3].entries()) {
    await pg.evaluate((tt) => window.__render(tt), t);
    await pg.screenshot({ path: path.join(outDir, 'dry' + i + '.png') });
  }
  await browser.close(); fs.rmSync(framesDir, { recursive: true, force: true }); process.exit(0);
}
const total = Math.round(dur * FPS);
const workers = 2;
await Promise.all(Array.from({ length: workers }, async (_, w) => {
  const page = await open('engine.html');
  for (let i = w; i < total; i += workers) {
    await page.evaluate((tt) => window.__render(tt), i / FPS);
    await page.screenshot({ path: path.join(framesDir, 'f' + String(i).padStart(5, '0') + '.png'), type: 'png' });
  }
  await page.close();
}));
await browser.close();

const mp4 = path.join(outDir, spec.id + '.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.png'),
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-shortest',
  '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
fs.rmSync(framesDir, { recursive: true, force: true });
console.log(JSON.stringify({ mp4, cover: coverPath, duration: dur, bytes: fs.statSync(mp4).size }));
