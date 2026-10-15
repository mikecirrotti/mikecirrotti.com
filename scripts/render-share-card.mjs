/**
 * Builds the site's share card and icons, and rasterizes them.
 *
 *   node scripts/render-share-card.mjs
 *
 * Writes:
 *   public/og-default.png        1200x630, the preview a messaging app shows for a shared link
 *   public/apple-touch-icon.png  180x180, the iPhone home-screen and fallback preview icon
 *   public/icon-192.png          192x192, for browsers that want a larger icon
 *   public/favicon.ico           32x32 PNG (browsers sniff the format, as the Astro starter's did)
 *
 * The name and title come from src/lib/identity.ts, so a positioning change is still one edit —
 * rerun this script after it. Colors are lifted from src/styles/global.css. Fonts are the site's
 * own (Rubik, Public Sans), fetched from Google Fonts at render time and inlined, because a
 * headless browser that can't reach the network would silently fall back to a system font.
 *
 * Same CDP approach as render-image.mjs: no dependencies beyond the Chromium Playwright installs.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// identity.ts is TypeScript, so read the two strings out of it rather than importing it.
const identitySrc = readFileSync(join(ROOT, 'src/lib/identity.ts'), 'utf8');
const field = (key) => identitySrc.match(new RegExp(`${key}:\\s*'([^']+)'`))[1];
const NAME = field('name');
const TITLE = field('title');

// Palette — src/styles/global.css
const INK = '#090b11'; // --gray-0
const SLATE = '#141925'; // --gray-50
const PALE = '#c3cadb'; // --gray-700
const ACCENT_LIGHT = '#3da876'; // --accent-light
const ACCENT = '#0c7a47'; // --accent-regular
const ACCENT_DARK = '#04240f'; // --accent-dark

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

async function inlineFonts() {
	const cssUrl =
		'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400&family=Rubik:wght@600&display=block';
	// A desktop user agent gets woff2; the default one gets ttf, which also works but is larger.
	const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120 Safari/537.36' };
	let css = await fetch(cssUrl, { headers: ua }).then((r) => r.text());
	for (const [, url] of css.matchAll(/url\((https:[^)]+)\)/g)) {
		const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
		css = css.replace(url, `data:font/woff2;base64,${buf.toString('base64')}`);
	}
	return css;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function cardHtml(fonts) {
	return `<style>${fonts}
		html,body{margin:0;width:1200px;height:630px;overflow:hidden}
		.card{box-sizing:border-box;width:1200px;height:630px;padding:0 96px;
			display:flex;flex-direction:column;justify-content:center;
			background:radial-gradient(circle at 100% 100%, ${ACCENT_DARK} 0%, ${SLATE} 45%, ${INK} 100%);
			position:relative}
		.bar{width:120px;height:10px;border-radius:5px;margin-bottom:44px;
			background:linear-gradient(90deg, ${ACCENT_LIGHT}, ${ACCENT})}
		h1{margin:0;font:600 104px/1.05 Rubik;color:#fff;letter-spacing:-0.01em}
		p{margin:28px 0 0;font:400 46px/1.2 'Public Sans';color:${ACCENT_LIGHT}}
		.url{position:absolute;left:96px;bottom:64px;font:400 28px 'Public Sans';color:${PALE}}
	</style>
	<div class="card">
		<div class="bar"></div>
		<h1>${NAME}</h1>
		<p>${TITLE}</p>
		<div class="url">mikecirrotti.com</div>
	</div>`;
}

// One monogram drawn at each size, rather than one drawn large and scaled down, so the 32px
// version gets proportionally heavier letters and stays legible in a browser tab.
function iconHtml(size, fonts) {
	const radius = size >= 180 ? 0 : Math.round(size * 0.2); // iOS rounds the corners itself
	const fontSize = Math.round(size * (size <= 32 ? 0.56 : 0.46));
	return `<style>${fonts}
		html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:transparent}
		.icon{width:${size}px;height:${size}px;border-radius:${radius}px;
			display:flex;align-items:center;justify-content:center;
			background:linear-gradient(150deg, ${ACCENT_LIGHT} 0%, ${ACCENT} 55%, ${ACCENT_DARK} 130%);
			font:600 ${fontSize}px/1 Rubik;color:#fff;letter-spacing:-0.02em}
	</style><div class="icon">MC</div>`;
}

/* ------------------------------------------------------------------ */
/* Rasterize via CDP                                                   */
/* ------------------------------------------------------------------ */

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 9334;

function connect(url) {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(url);
		let id = 0;
		const pending = new Map();
		ws.addEventListener('open', () =>
			resolve({
				send(method, params = {}) {
					const msgId = ++id;
					ws.send(JSON.stringify({ id: msgId, method, params }));
					return new Promise((res, rej) => pending.set(msgId, { res, rej }));
				},
				close: () => ws.close(),
			}),
		);
		ws.addEventListener('error', reject);
		ws.addEventListener('message', (ev) => {
			const msg = JSON.parse(ev.data);
			if (msg.id && pending.has(msg.id)) {
				const { res, rej } = pending.get(msg.id);
				pending.delete(msg.id);
				msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
			}
		});
	});
}

async function waitForTarget() {
	for (let i = 0; i < 100; i++) {
		try {
			const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
			const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
			if (page) return page;
		} catch {
			/* browser not up yet */
		}
		await new Promise((r) => setTimeout(r, 100));
	}
	throw new Error('Chromium did not expose a page target');
}

async function withBrowser(fn) {
	const profile = mkdtempSync(join(tmpdir(), 'share-card-chrome-'));
	const chrome = spawn(
		CHROME,
		[
			'--headless=new',
			'--no-sandbox',
			'--disable-gpu',
			'--hide-scrollbars',
			'--force-color-profile=srgb',
			`--user-data-dir=${profile}`,
			`--remote-debugging-port=${PORT}`,
			'about:blank',
		],
		{ stdio: 'ignore' },
	);
	try {
		const target = await waitForTarget();
		const cdp = await connect(target.webSocketDebuggerUrl);
		await cdp.send('Page.enable');
		await cdp.send('Runtime.enable');
		const result = await fn(cdp, profile);
		cdp.close();
		return result;
	} finally {
		// Wait for Chromium to exit before deleting its profile; it writes to it until then.
		const exited = new Promise((r) => chrome.once('exit', r));
		chrome.kill('SIGKILL');
		await exited;
		rmSync(profile, { recursive: true, force: true });
	}
}

async function shoot(cdp, profile, html, width, height) {
	const path = join(profile, `page-${width}x${height}.html`);
	writeFileSync(path, `<!doctype html><meta charset="utf-8">${html}`);
	await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
	await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
	await cdp.send('Page.navigate', { url: `file://${path}` });
	// Wait for the inlined fonts to finish decoding, or the capture shows the fallback face.
	for (let i = 0; i < 50; i++) {
		const { result } = await cdp.send('Runtime.evaluate', {
			expression: 'document.readyState === "complete" && document.fonts.status === "loaded"',
		});
		if (result.value) break;
		await new Promise((r) => setTimeout(r, 100));
	}
	const { data } = await cdp.send('Page.captureScreenshot', {
		format: 'png',
		clip: { x: 0, y: 0, width, height, scale: 1 },
	});
	return Buffer.from(data, 'base64');
}

const fonts = await inlineFonts();

const outputs = [
	['public/og-default.png', cardHtml(fonts), 1200, 630],
	['public/apple-touch-icon.png', iconHtml(180, fonts), 180, 180],
	['public/icon-192.png', iconHtml(192, fonts), 192, 192],
	['public/favicon.ico', iconHtml(32, fonts), 32, 32],
];

await withBrowser(async (cdp, profile) => {
	for (const [rel, html, w, h] of outputs) {
		const png = await shoot(cdp, profile, html, w, h);
		writeFileSync(join(ROOT, rel), png);
		console.log(`wrote ${rel} (${(png.length / 1024).toFixed(1)} KB, ${w}x${h})`);
	}
});
