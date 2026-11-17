# Roblox-style Shorts Renderer — starter prototype

This is an original block-style 3D animation test project. It does **not** use Roblox characters, logos, maps, or assets.

## What this first prototype does
- Builds two simple procedural 3D characters and a small outdoor environment with Three.js.
- Animates basic walking, arm gestures, a glowing cube, and a moving camera.
- Renders a 10-second vertical MP4 (540×960 by default) using Puppeteer + headless Chromium.
- Encodes the frames with FFmpeg.

## Run locally
Requires Node.js 20+.

```bash
npm install
npm run render
```

The result is `output/test-video.mp4`.

## Run on GitHub
1. Create a public GitHub repository.
2. Upload all files and folders from this project, preserving the folder structure.
3. Open **Actions** → **Render test video** → **Run workflow**.
4. Keep width `540` and height `960` for the first test.
5. When the run completes, download the `test-video` artifact.

## Important limitations
This is only the first visual-rendering prototype. It does not yet include AI-generated stories, AI voices, lip-sync, subtitles, music, automatic YouTube uploads, or n8n integration. Those should be added and tested in separate stages after the basic render succeeds.

GitHub Actions availability and usage limits depend on GitHub's current plan and repository settings. A public repository does not mean every kind of compute is unlimited.
