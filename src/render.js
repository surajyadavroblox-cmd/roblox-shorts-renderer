import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const out = path.join(root, 'output');
const frames = path.join(out, 'frames');

await fs.mkdir(out, { recursive: true });
await fs.rm(frames, { recursive: true, force: true });
await fs.mkdir(frames, { recursive: true });

const width = Number(process.env.WIDTH || 540);
const height = Number(process.env.HEIGHT || 960);
const fps = 24;
const duration = 10;
const total = fps * duration;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.css': 'text/css'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    const filePath = path.resolve(root, '.' + pathname);

    if (
      filePath !== root &&
      !filePath.startsWith(root + path.sep)
    ) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });

    res.end(data);
  } catch (error) {
    res.writeHead(404);
    res.end('File not found');
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
const sceneUrl = `http://127.0.0.1:${address.port}/src/scene.html`;

let browser;

try {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage();

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1
  });

  page.on('pageerror', error => {
    console.error('Browser error:', error.message);
  });

  console.log('Opening 3D scene:', sceneUrl);

  await page.goto(sceneUrl, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  await page.waitForFunction(
    () => typeof window.renderAt === 'function',
    { timeout: 60000 }
  );

  console.log('3D scene loaded successfully!');

  for (let i = 0; i < total; i++) {
    await page.evaluate(
      t => window.renderAt(t),
      i / fps
    );

    await page.screenshot({
      path: path.join(
        frames,
        `frame-${String(i).padStart(5, '0')}.png`
      )
    });
  }

  console.log('All video frames generated!');

} finally {
  if (browser) {
    await browser.close();
  }

  await new Promise(resolve => server.close(resolve));
}

const mp4 = path.join(out, 'test-video.mp4');

const args = [
  '-y',
  '-framerate', String(fps),
  '-i', path.join(frames, 'frame-%05d.png'),
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-crf', '25',
  '-pix_fmt', 'yuv420p',
  '-threads', '2',
  '-movflags', '+faststart',
  mp4
];

await new Promise((resolve, reject) => {
  const process = spawn(ffmpegPath, args, {
    stdio: 'inherit'
  });

  process.on('error', reject);

  process.on('close', code => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`FFmpeg exited with code ${code}`));
    }
  });
});

console.log(`Rendered successfully: ${mp4}`);
