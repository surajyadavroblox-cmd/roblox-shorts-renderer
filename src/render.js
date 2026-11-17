import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const out = path.join(root, 'output');
const frames = path.join(out, 'frames');

const width = Number(process.env.WIDTH || 540);
const height = Number(process.env.HEIGHT || 960);

const fps = 24;
const duration = 10;
const total = fps * duration;

console.log('Starting Roblox Shorts Renderer...');

await fs.rm(out, {
  recursive: true,
  force: true
});

await fs.mkdir(frames, {
  recursive: true
});

// MIME TYPES

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// LOCAL HTTP SERVER

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname
    );

    const filePath = path.resolve(
      root,
      '.' + pathname
    );

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
      'Content-Type':
        mimeTypes[ext] || 'application/octet-stream'
    });

    res.end(data);

  } catch (error) {
    console.error('Server error:', error.message);

    res.writeHead(404);
    res.end('File not found');
  }
});

await new Promise((resolve, reject) => {
  server.once('error', reject);

  server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();

const sceneUrl =
  `http://127.0.0.1:${address.port}/src/scene.html`;

console.log('Scene URL:', sceneUrl);

// BROWSER

let browser;

try {

  browser = await puppeteer.launch({

    headless: true,

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ]

  });

  const page = await browser.newPage();

  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1
  });

  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      console.error('Browser console:', message.text());
    }
  });

  console.log('Opening 3D scene...');

  await page.goto(sceneUrl, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  // WAIT FOR THREE.JS ANIMATION FUNCTION

  await page.waitForFunction(
    () => typeof window.renderAt === 'function',
    {
      timeout: 60000
    }
  );

  console.log('3D scene loaded successfully!');

  // GENERATE VIDEO FRAMES

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

    if (i % 24 === 0) {
      console.log(
        `Rendering frame ${i}/${total}`
      );
    }

  }

  console.log('All video frames generated!');

  await browser.close();
  browser = null;

} finally {

  if (browser) {
    await browser.close();
  }

  server.close();

}

// FFMPEG VIDEO ENCODING

const mp4 = path.join(out, 'test-video.mp4');

console.log('Starting FFmpeg encoding...');

await new Promise((resolve, reject) => {

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

  const process = spawn(
    ffmpegPath,
    args,
    {
      stdio: 'inherit'
    }
  );

  process.on('error', reject);

  process.on('close', code => {

    if (code === 0) {
      resolve();
    } else {
      reject(
        new Error(`FFmpeg exited with code ${code}`)
      );
    }

  });

});

console.log('VIDEO RENDERED SUCCESSFULLY!');
console.log('Output:', mp4);
