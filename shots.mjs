// CDP capture pass for the portfolio demo.
import WebSocket from "ws";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const OUT = "A:/hapnoid/maximus/morpheus/portfolio/shots";
fs.mkdirSync(OUT, { recursive: true });
const URL_ = "http://127.0.0.1:4613/";
const CDP = "http://127.0.0.1:9223";

const getJson = (url) =>
  new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- browser-level ws ----------------------------------------------------
const version = await getJson(CDP + "/json/version");
const bws = new WebSocket(version.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
await new Promise((r) => bws.on("open", r));
let bid = 0;
const bpend = new Map();
bws.on("message", (m) => {
  const msg = JSON.parse(m);
  if (msg.id && bpend.has(msg.id)) { bpend.get(msg.id)(msg); bpend.delete(msg.id); }
});
const bsend = (method, params = {}) =>
  new Promise((resolve) => { const i = ++bid; bpend.set(i, resolve); bws.send(JSON.stringify({ id: i, method, params })); });

const { targetId } = (await bsend("Target.createTarget", { url: "about:blank" })).result;

// --- attach to the page ---------------------------------------------------
const { sessionId } = (await bsend("Target.attachToTarget", { targetId, flatten: true })).result;
const ws = bws; // flattened sessions share the socket
let id = 0;
const pending = new Map();
ws.on("message", (m) => {
  const msg = JSON.parse(m);
  if (msg.sessionId !== sessionId) return;
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    console.log("[console." + msg.params.type + "]", msg.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 300));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    console.log("[exception]", msg.params.exceptionDetails?.exception?.description?.slice(0, 400) || JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
  }
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) =>
  new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const evalJs = async (expr, awaitPromise = false) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise });
  if (r.result?.exceptionDetails) console.log("[eval-err]", r.result.exceptionDetails?.exception?.description?.slice(0, 300));
  return r.result?.result?.value;
};
const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.result.data, "base64"));
  console.log("saved", name);
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

await send("Page.navigate", { url: URL_ });
await sleep(4000);

// 1. hero (dark)
await shot("01-hero-dark");

// 2. about — catch ASCII state, mid diffusion, final photo
await evalJs(`window.scrollTo({top: document.querySelector('.ribbon').getBoundingClientRect().top + window.scrollY - 120, behavior:'instant'})`);
await sleep(1000);
await shot("02b-ribbon-wave");
await evalJs(`document.getElementById('about').scrollIntoView({behavior:'instant'})`);
await sleep(700);
await shot("02-about-ascii");
await sleep(1400);
await shot("03-about-mid-diffusion");
await sleep(3600);
await shot("04-about-photo");

// 3. re-diffuse on hover
await evalJs(`document.querySelector('.diffusion').dispatchEvent(new PointerEvent('pointerenter', {bubbles:true}))`);
await sleep(1600);
await shot("05-about-rediffuse");
await sleep(3600);

// 4. ribbon + projects
await evalJs(`document.getElementById('work').scrollIntoView({behavior:'instant'})`);
await sleep(3200);
await shot("06-projects");

// 5. experience
await evalJs(`document.getElementById('xp').scrollIntoView({behavior:'instant'})`);
await sleep(1400);
await shot("07-experience");

// 5b. globe strip pass — right, center, left
await evalJs(`
  (() => {
    const sec = document.getElementById('globe');
    const vh = window.innerHeight;
    const total = sec.getBoundingClientRect().height - vh;
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + total * 0.12, behavior: 'instant' });
  })()
`);
await sleep(1500);
await shot("07c-globe-right");
await evalJs(`
  (() => {
    const sec = document.getElementById('globe');
    const vh = window.innerHeight;
    const total = sec.getBoundingClientRect().height - vh;
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + total * 0.5, behavior: 'instant' });
  })()
`);
await sleep(2500);
await shot("07d-globe-center");
await evalJs(`
  (() => {
    const sec = document.getElementById('globe');
    const vh = window.innerHeight;
    const total = sec.getBoundingClientRect().height - vh;
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY + total * 0.85, behavior: 'instant' });
  })()
`);
await sleep(1200);
await shot("07e-globe-left");

// 5b. skills ribbon
await evalJs(`window.scrollTo({top: document.querySelectorAll('.ribbon')[1].getBoundingClientRect().top + window.scrollY - 160, behavior:'instant'})`);
await sleep(1000);
await shot("07b-ribbon-line");

// 6. contact (ParticleText gather → settled)
await evalJs(`document.getElementById('contact').scrollIntoView({behavior:'instant'})`);
await sleep(1200);
await shot("08-contact-particles");
await sleep(2500);
await shot("09-contact-settled");

// 7. light mode hero + about
await evalJs(`document.querySelector('.theme-btn').click()`);
await sleep(600);
await evalJs(`window.scrollTo({top:0, behavior:'instant'})`);
await sleep(1400);
await shot("10-hero-light");
await evalJs(`document.getElementById('about').scrollIntoView({behavior:'instant'})`);
await sleep(4200);
await shot("11-about-light");

// 8. mobile pass (dark again)
await evalJs(`document.querySelector('.theme-btn').click()`);
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await evalJs(`window.scrollTo({top:0, behavior:'instant'})`);
await sleep(3500);
await shot("12-mobile-hero");
await evalJs(`document.getElementById('work').scrollIntoView({behavior:'instant'})`);
await sleep(1400);
await shot("13-mobile-projects");

// 9. reactbits TechText demo — reference for the hero name comparison
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "https://reactbits.dev/text-animations/tech-text" });
await sleep(10000);
await shot("14-rb-techtext-demo");

const errs = await evalJs(`window.__errCount || 0`);
console.log("done. body scrollH:", await evalJs("document.documentElement.scrollHeight"));
bws.close();
process.exit(0);
