/**
 * Builds the Engram Wiki case-study image and rasterizes it.
 *
 *   node scripts/render-image.mjs
 *
 * Writes public/assets/engram-wiki.svg (editable source) and
 * public/assets/engram-wiki.jpg (the file the site actually ships).
 *
 * Concept — "trace through the scaffold". A repository's worth of dormant
 * markdown lines, most of it unlit, which is literally true of a repo that
 * ships intentionally empty. One memory trace is written through the field,
 * and the files it touches light up.
 *
 * Colors are lifted from src/styles/global.css. No dependencies — the JPEG
 * comes out of Chromium's own encoder over CDP, because the ffmpeg bundled
 * with Playwright is built --disable-everything and has no JPEG encoder to
 * convert through.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_SVG = join(ROOT, 'public/assets/engram-wiki.svg');
const OUT_JPG = join(ROOT, 'public/assets/engram-wiki.jpg');

const W = 1472;
const H = 871;

// Palette — src/styles/global.css
const ACCENT_LIGHT = '#3da876'; // --accent-light
const SLATE = '#141925'; // --gray-50 light, for the cool corner shadow
const PALE = '#e3e6ee'; // --gray-800 light
const GLOW = '#8ceec0'; // lifted tint of --accent-light

// The card is single-column at 11rem below 50em, which crops to roughly the
// middle 40% of the image's height. The trace stays inside this band; the
// scaffold fills the whole frame, so the crop always has texture.
const SAFE_TOP = 270;
const SAFE_BOTTOM = 610;

/** mulberry32 — fixed seed so reruns are byte-identical. */
function rng(seed) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * CSS `linear-gradient(150deg, …)` expressed as userSpaceOnUse endpoints.
 * Direction vector is (sin150, -cos150) = (0.5, 0.866): right and down.
 */
function gradient150(w, h) {
	const dx = 0.5;
	const dy = 0.8660254;
	const len = Math.abs(w * dx) + Math.abs(h * dy);
	return {
		x1: r2(w / 2 - (dx * len) / 2),
		y1: r2(h / 2 - (dy * len) / 2),
		x2: r2(w / 2 + (dx * len) / 2),
		y2: r2(h / 2 + (dy * len) / 2),
	};
}

/* ---------------- the trace ---------------- */

// Deliberately irregular. A smooth sine reads as decoration rather than as a
// path something actually took.
const TRACE = [
	[[26, 505], [150, 560], [214, 592], [326, 566]],
	[[326, 566], [452, 538], [452, 372], [598, 356]],
	[[598, 356], [712, 344], [742, 430], [846, 452]],
	[[846, 452], [962, 476], [1010, 574], [1136, 546]],
	[[1136, 546], [1244, 522], [1262, 424], [1382, 408]],
	[[1382, 408], [1420, 403], [1436, 400], [1462, 396]],
];

function cubic(p0, p1, p2, p3, t) {
	const u = 1 - t;
	return [
		u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
		u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
	];
}

function samplePath(segs, per = 160) {
	const pts = [];
	for (const [p0, p1, p2, p3] of segs) {
		for (let i = 0; i <= per; i++) pts.push(cubic(p0, p1, p2, p3, i / per));
	}
	return pts;
}

function pathD(segs) {
	let d = `M${segs[0][0][0]} ${segs[0][0][1]}`;
	for (const [, p1, p2, p3] of segs) d += `C${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]} ${p3[0]} ${p3[1]}`;
	return d;
}

function minDist(pts, x, y) {
	let m = Infinity;
	for (let i = 0; i < pts.length; i++) {
		const dx = pts[i][0] - x;
		const dy = pts[i][1] - y;
		const d = dx * dx + dy * dy;
		if (d < m) m = d;
	}
	return Math.sqrt(m);
}

/* ---------------- the scaffold ---------------- */

const PITCH_X = 132;
const PITCH_Y = 96;
const LINE_GAP = 10.5;

/**
 * A grid of file blocks. Brightness is decided per *block*, not per line —
 * the trace touches a file and the whole file becomes known, rather than
 * slicing a lit channel through the middle of half-lit files.
 */
function buildScaffold(pts) {
	const rand = rng(20260609);
	const dim = [];
	const mid = [];
	const hot = [];
	const marks = [];

	for (let gx = 0; gx * PITCH_X < W + 60; gx++) {
		// Per-column jitter, so the field reads as files rather than a table.
		const jx = rand() * 14 - 7;
		const jy = rand() * 18 - 9;
		for (let gy = 0; gy * PITCH_Y < H + 40; gy++) {
			const x0 = r2(gx * PITCH_X + 26 + jx + rand() * 6);
			const y0 = r2(gy * PITCH_Y + 30 + jy + rand() * 6);

			// Mild left-to-right accretion: the field fills in over time.
			const accrete = x0 / W;
			const n = 3 + Math.floor(rand() * 4) + (rand() < accrete * 0.7 ? 1 : 0);

			// Distance from the trace to the block's centre of mass.
			const bw = 62;
			const bh = (n - 1) * LINE_GAP;
			const d = minDist(pts, x0 + bw / 2, y0 + bh / 2);
			const tier = d < 62 ? 2 : d < 148 ? 1 : 0;
			const heat = tier === 2 ? 1 - d / 62 : tier === 1 ? 1 - (d - 62) / 86 : 0;

			for (let i = 0; i < n; i++) {
				const y = r2(y0 + i * LINE_GAP);
				// First line is a heading: shorter and brighter, like a markdown file.
				const head = i === 0;
				const len = r2(head ? 26 + rand() * 30 : 18 + rand() * 62);
				const bar = (w, fill, op) =>
					`<rect x="${x0}" y="${r2(y - w / 2)}" width="${len}" height="${w}" rx="${r2(w / 2)}" fill="${fill}" opacity="${op}"/>`;

				if (tier === 2) {
					hot.push(bar(head ? 3.2 : 2.6, PALE, r2(0.5 + heat * 0.46)));
					// Bullet dots read as markdown lists at hero size.
					if (!head && rand() < 0.42) {
						hot.push(
							`<circle cx="${r2(x0 - 6)}" cy="${y}" r="1.5" fill="${GLOW}" opacity="${r2(0.4 + heat * 0.45)}"/>`,
						);
					}
				} else if (tier === 1) {
					mid.push(bar(head ? 2.5 : 2.1, head ? GLOW : ACCENT_LIGHT, r2(0.11 + heat * 0.31)));
				} else {
					const base = (head ? 0.09 : 0.055) + accrete * 0.03;
					dim.push(bar(head ? 2.1 : 1.8, head ? GLOW : ACCENT_LIGHT, r2(base + rand() * 0.045)));
				}
			}

			// One file marker per lit block, at the block's own origin.
			if (tier === 2 && heat > 0.35) {
				marks.push(
					`<rect x="${r2(x0 - 15)}" y="${r2(y0 - 8)}" width="12" height="12" rx="3" fill="none" stroke="${GLOW}" stroke-width="1.5" opacity="${r2(0.55 + heat * 0.4)}"/>`,
				);
			}
		}
	}
	return { dim, mid, hot, marks };
}

function buildSvg() {
	const g = gradient150(W, H);
	const pts = samplePath(TRACE);
	const { dim, mid, hot, marks } = buildScaffold(pts);
	const d = pathD(TRACE);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<defs>
<linearGradient id="ground" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">
<stop offset="0" stop-color="#02150a"/>
<stop offset="0.34" stop-color="#07401f"/>
<stop offset="0.56" stop-color="#0a5c33"/>
<stop offset="0.8" stop-color="#052d16"/>
<stop offset="1" stop-color="#02150a"/>
</linearGradient>
<radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="736" cy="436" r="880">
<stop offset="0.42" stop-color="#000000" stop-opacity="0"/>
<stop offset="1" stop-color="#000000" stop-opacity="0.62"/>
</radialGradient>
<radialGradient id="coolshadow" gradientUnits="userSpaceOnUse" cx="120" cy="90" r="700">
<stop offset="0" stop-color="${SLATE}" stop-opacity="0.45"/>
<stop offset="1" stop-color="${SLATE}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="trace" gradientUnits="userSpaceOnUse" x1="80" y1="560" x2="1420" y2="380">
<stop offset="0" stop-color="${ACCENT_LIGHT}"/>
<stop offset="0.45" stop-color="${GLOW}"/>
<stop offset="1" stop-color="${PALE}"/>
</linearGradient>
<filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
<feGaussianBlur stdDeviation="14"/>
</filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" result="n"/>
<feColorMatrix in="n" type="saturate" values="0"/>
</filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#ground)"/>
<rect width="${W}" height="${H}" fill="url(#coolshadow)" style="mix-blend-mode:multiply"/>

<g>${dim.join('')}</g>
<g>${mid.join('')}</g>
<g style="mix-blend-mode:screen" opacity="0.5" filter="url(#bloom)"><g>${hot.join('')}</g></g>
<g>${hot.join('')}</g>

<g style="mix-blend-mode:screen" opacity="0.55" filter="url(#bloom)">
<path d="${d}" fill="none" stroke="${GLOW}" stroke-width="6" stroke-linecap="round"/>
</g>
<path d="${d}" fill="none" stroke="url(#trace)" stroke-width="2.4" stroke-linecap="round" opacity="0.95"/>
<g style="mix-blend-mode:screen">${marks.join('')}</g>

<rect width="${W}" height="${H}" fill="url(#vignette)"/>
<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.05" style="mix-blend-mode:overlay"/>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Rasterize via CDP                                                   */
/* ------------------------------------------------------------------ */

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 9333;

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

async function rasterize(svg) {
	const profile = mkdtempSync(join(tmpdir(), 'engram-chrome-'));
	const htmlPath = join(profile, 'page.html');
	writeFileSync(
		htmlPath,
		`<!doctype html><meta charset="utf-8"><style>
			html,body{margin:0;padding:0;background:#02150a;overflow:hidden}
			svg{display:block;width:${W}px;height:${H}px}
		</style>${svg}`,
	);

	const chrome = spawn(
		CHROME,
		[
			'--headless=new',
			'--no-sandbox',
			'--disable-gpu',
			'--hide-scrollbars',
			'--force-device-scale-factor=1',
			'--force-color-profile=srgb',
			`--user-data-dir=${profile}`,
			`--remote-debugging-port=${PORT}`,
			`--window-size=${W},${H}`,
			`file://${htmlPath}`,
		],
		{ stdio: 'ignore' },
	);

	try {
		const target = await waitForTarget();
		const cdp = await connect(target.webSocketDebuggerUrl);
		await cdp.send('Page.enable');
		await cdp.send('Emulation.setDeviceMetricsOverride', {
			width: W,
			height: H,
			deviceScaleFactor: 1,
			mobile: false,
		});
		// SVG filters (turbulence, blur) need a beat to settle before capture.
		// Note: captureBeyondViewport must stay off — it suppresses filter and
		// background rendering in this Chromium build.
		await new Promise((r) => setTimeout(r, 900));
		const { data } = await cdp.send('Page.captureScreenshot', {
			format: 'jpeg',
			quality: 92,
			clip: { x: 0, y: 0, width: W, height: H, scale: 1 },
		});
		cdp.close();
		return Buffer.from(data, 'base64');
	} finally {
		chrome.kill('SIGKILL');
		rmSync(profile, { recursive: true, force: true });
	}
}

const svg = buildSvg();
writeFileSync(OUT_SVG, svg);
console.log(`wrote ${OUT_SVG} (${(svg.length / 1024).toFixed(1)} KB)`);

const jpg = await rasterize(svg);
writeFileSync(OUT_JPG, jpg);
console.log(`wrote ${OUT_JPG} (${(jpg.length / 1024).toFixed(1)} KB, ${W}x${H})`);
console.log(`trace stays within the card-crop safe band: y ${SAFE_TOP}–${SAFE_BOTTOM}`);
