// Records the prototype's "Watch the demo" mode to an MP4 (1920 × 1080, 30 fps).
//
// Needs Google Chrome, ffmpeg and playwright-core:
//   npm install --no-save playwright-core
//   python3 -m http.server 4870 --bind 127.0.0.1     (from the prototype folder)
//   node tools/record-demo.js http://127.0.0.1:4870/ media/Mania4-Platform-Demo.mp4
//
// Chrome's screencast frames are written to ffmpeg at a constant frame rate,
// repeating the last frame while the screen is still.

const { chromium } = require("playwright-core");
const { spawn } = require("child_process");

const [base = "http://127.0.0.1:4870/", out = "media/Mania4-Platform-Demo.mp4", W = "1920", H = "1080"] = process.argv.slice(2);
const FPS = 30;
const FFMPEG = process.env.FFMPEG || "ffmpeg";
// New headless Chrome keeps 87 px of window for browser chrome.
const CHROME_UI = 87;

(async () => {
  const ff = spawn(
    FFMPEG,
    ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
      "-vf", `scale=${W}:${H}:flags=lanczos,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "18",
      "-tune", "animation", "-movflags", "+faststart", out],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars", `--window-size=${W},${+H + CHROME_UI}`],
  });
  const page = await browser.newPage({ viewport: null });
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  const size = await page.evaluate(() => [innerWidth, innerHeight]);
  if (size[0] !== +W || size[1] !== +H) console.warn(`Viewport is ${size.join("×")}, expected ${W}×${H}`);

  const cdp = await page.context().newCDPSession(page);
  let last = null;
  let written = 0;
  let t0 = null;
  const write = (buf, n) => {
    for (let i = 0; i < n; i++) ff.stdin.write(buf);
    written += n;
  };
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    if (t0 === null) t0 = metadata.timestamp;
    if (last) write(last, Math.max(0, Math.round((metadata.timestamp - t0) * FPS) - written));
    last = Buffer.from(data, "base64");
  });

  const url = new URL(base);
  url.searchParams.set("autoplay", "");
  url.searchParams.set("record", "");
  url.hash = "overview";
  await page.goto(url.toString());
  await page.waitForFunction(() => window.__proto && window.__proto.isReady(), null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: +W, maxHeight: +H, everyNthFrame: 1 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.__proto.playFrom(0);
  });
  const start = Date.now();
  while (Date.now() - start < 10 * 60 * 1000) {
    const title = await page.title();
    if (title.startsWith("demo-")) {
      console.log(title);
      break;
    }
    await page.waitForTimeout(500);
  }
  await cdp.send("Page.stopScreencast");
  if (last) write(last, FPS);
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`${out}: ${written} frames, ${(written / FPS).toFixed(1)} s`);
  await browser.close();
})();
