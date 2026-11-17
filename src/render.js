import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output');
const frames = path.join(out, 'frames');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(frames, { recursive: true });

const width = Number(process.env.WIDTH || 540);
const height = Number(process.env.HEIGHT || 960);
const fps = 24;
const duration = 10;
const total = fps * duration;
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader',
         '--enable-webgl', '--ignore-gpu-blocklist']
});
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  await page.waitForFunction(() => typeof window.renderAt === 'function');
  for (let i=0; i<total; i++) {
    await page.evaluate(t => window.renderAt(t), i/fps);
    await page.screenshot({ path: path.join(frames, `frame-${String(i).padStart(5,'0')}.png`) });
  }
} finally {
  await browser.close();
}
const mp4 = path.join(out, 'test-video.mp4');
await new Promise((resolve,reject) => {
  const args = ['-y','-framerate',String(fps),'-i',path.join(frames,'frame-%05d.png'),
    '-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p',
    '-threads','2','-movflags','+faststart',mp4];
  const p = spawn(ffmpegPath,args,{stdio:'inherit'});
  p.on('error',reject); p.on('close',code => code===0?resolve():reject(new Error(`FFmpeg exited ${code}`)));
});
console.log(`Rendered ${mp4}`);
