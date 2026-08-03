/**
 * Builds the Engram Wiki case-study image and rasterizes it.
 *
 *   node scripts/render-image.mjs
 *
 * Writes public/assets/engram-wiki.svg (editable source) and
 * public/assets/engram-wiki.jpg (the file the site actually ships).
 *
 * Concept — "river into lakes, wired". Raw daily signal streams in from the
 * left as loose particles, consolidates into a few luminous basins (topics,
 * projects, people, decisions), and those basins are wired together by
 * filaments: the enduring trace the project is named for.
 *
 * Colors are lifted verbatim from src/styles/global.css. No dependencies —
 * the JPEG comes out of Chromium's own encoder over CDP, because the ffmpeg
 * bundled with Playwright is built --disable-everything and has no JPEG
 * encoder to convert through.
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
const ACCENT_REGULAR = '#0c7a47'; // --accent-regular
const ACCENT_DARK = '#04240f'; // --accent-dark
const SLATE = '#141925'; // --gray-50 light, for the cool corner shadow
const PALE = '#e3e6ee'; // --gray-800 light
const GLOW = '#8ceec0'; // lifted tint of --accent-light, for cores and nodes

// The card on /work and / is single-column at 11rem below 50em, which crops to
// roughly the middle 40% of the image's height. Everything load-bearing stays
// inside this band; only soft glow is allowed to bleed past it.
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
	const cx = w / 2;
	const cy = h / 2;
	return {
		x1: r2(cx - (dx * len) / 2),
		y1: r2(cy - (dy * len) / 2),
		x2: r2(cx + (dx * len) / 2),
		y2: r2(cy + (dy * len) / 2),
	};
}

// The four basins. Ordered back-to-front; the first is the big lake.
const BASINS = [
	{ cx: 880, cy: 390, rx: 155, ry: 112, core: 0.95 }, // topics
	{ cx: 1185, cy: 505, rx: 104, ry: 74, core: 0.8 }, // projects
	{ cx: 985, cy: 578, rx: 86, ry: 58, core: 0.72 }, // people
	{ cx: 672, cy: 498, rx: 60, ry: 43, core: 0.62 }, // decisions — first consolidation
];

// Filaments: [x1,y1, cx1,cy1, cx2,cy2, x2,y2, width, opacity]
// The B4 → B1 → B2 run is the bright consolidated trace. Curves are kept from
// crossing each other — a stray intersection reads as an accidental shape
// rather than a connection.
const FILAMENTS = [
	// tributaries out of the particle field, converging on B4's left side
	[340, 430, 440, 428, 540, 452, 638, 484, 1.6, 0.32],
	[352, 566, 452, 566, 545, 534, 640, 506, 1.6, 0.28],
	// the trace
	[688, 478, 760, 430, 800, 400, 872, 390, 3.0, 0.82],
	[900, 396, 1010, 410, 1080, 452, 1178, 496, 2.6, 0.74],
	// secondary links
	[886, 420, 920, 490, 946, 530, 976, 562, 1.9, 0.5],
	[1010, 570, 1080, 552, 1120, 528, 1168, 512, 1.7, 0.44],
	[726, 486, 820, 520, 880, 552, 962, 572, 1.5, 0.3],
	// recall / export — fanning off toward the right edge
	[1216, 486, 1290, 462, 1350, 442, 1424, 420, 1.8, 0.34],
	[1216, 520, 1292, 534, 1352, 546, 1428, 560, 1.4, 0.22],
];

// Nodes sit where filaments meet: basin centers plus a couple of junctions.
const NODES = [
	{ x: 880, y: 390, r: 6 },
	{ x: 1185, y: 505, r: 5 },
	{ x: 985, y: 578, r: 4.5 },
	{ x: 672, y: 498, r: 4 },
	{ x: 1214, y: 492, r: 3 },
];

function buildParticles() {
	const rand = rng(20260609); // publishDate, because it had to be something
	const out = [];
	for (let i = 0; i < 320; i++) {
		const t = rand();
		// Bias toward the left: the river is dense at its source and thins out.
		const x = 30 + Math.pow(t, 1.55) * 760;
		// Centerline drifts gently upward as the flow moves right.
		const center = 496 - Math.pow(x / 790, 2) * 40;
		// Spread is wide at the source and narrows as the flow consolidates.
		const spread = 158 - (x / 790) * 92;
		const g = (rand() + rand() + rand() - 1.5) / 1.5; // ~gaussian, clamped
		const y = center + g * spread;
		if (y < 190 || y > 780) continue;

		const near = 1 - Math.min(1, Math.abs(g));
		const radius = r2(1.4 + rand() * 3.4 * (0.45 + near * 0.55));
		const opacity = r2(0.22 + rand() * 0.62 * (0.4 + near * 0.6));
		// Mostly luminous green so the field reads as signal, not gravel; a few
		// hot and a few pale flecks keep it from looking uniform.
		const tint = rand();
		const fill = tint > 0.92 ? PALE : tint > 0.66 ? GLOW : ACCENT_LIGHT;
		out.push(
			`<circle cx="${r2(x)}" cy="${r2(y)}" r="${radius}" fill="${fill}" opacity="${opacity}"/>`,
		);
	}
	return out.join('');
}

function buildBasins() {
	// No rim stroke: a hard outline turns a pool into a drawn orbit.
	return BASINS.map((b, i) => {
		const halo = `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${r2(b.rx * 2.4)}" ry="${r2(b.ry * 2.4)}" fill="url(#halo${i})"/>`;
		const body = `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="url(#pool${i})" opacity="${b.core}"/>`;
		return halo + body;
	}).join('');
}

function buildFilaments() {
	return FILAMENTS.map(([x1, y1, c1x, c1y, c2x, c2y, x2, y2, w, o]) => {
		return `<path d="M${x1} ${y1}C${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}" fill="none" stroke="url(#filament)" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
	}).join('');
}

function buildNodes() {
	return NODES.map(
		(n) =>
			`<circle cx="${n.x}" cy="${n.y}" r="${r2(n.r * 3.4)}" fill="url(#node)"/>` +
			`<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${PALE}" opacity="0.92"/>`,
	).join('');
}

function buildSvg() {
	const g = gradient150(W, H);
	const poolDefs = BASINS.map(
		(b, i) =>
			// A plateau through the middle, then a soft fade: enough body to read
			// as a consolidated pool, no hard edge that would read as a drawn
			// orbit. Cores stay emerald — the bloom pass supplies brightness.
			`<radialGradient id="pool${i}">` +
			`<stop offset="0" stop-color="${GLOW}" stop-opacity="0.52"/>` +
			`<stop offset="0.42" stop-color="${ACCENT_LIGHT}" stop-opacity="0.56"/>` +
			`<stop offset="0.74" stop-color="${ACCENT_LIGHT}" stop-opacity="0.34"/>` +
			`<stop offset="1" stop-color="${ACCENT_REGULAR}" stop-opacity="0"/>` +
			`</radialGradient>` +
			// Long, gentle falloff so the halo has no discernible edge.
			`<radialGradient id="halo${i}">` +
			`<stop offset="0" stop-color="${ACCENT_LIGHT}" stop-opacity="0.2"/>` +
			`<stop offset="0.35" stop-color="${ACCENT_LIGHT}" stop-opacity="0.11"/>` +
			`<stop offset="0.68" stop-color="${ACCENT_LIGHT}" stop-opacity="0.04"/>` +
			`<stop offset="1" stop-color="${ACCENT_LIGHT}" stop-opacity="0"/>` +
			`</radialGradient>`,
	).join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
<defs>
<linearGradient id="ground" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">
<stop offset="0" stop-color="${ACCENT_DARK}"/>
<stop offset="0.3" stop-color="#073a1e"/>
<stop offset="0.54" stop-color="${ACCENT_REGULAR}"/>
<stop offset="0.78" stop-color="#06351b"/>
<stop offset="1" stop-color="${ACCENT_DARK}"/>
</linearGradient>
<radialGradient id="lift" gradientUnits="userSpaceOnUse" cx="930" cy="452" r="620">
<stop offset="0" stop-color="${ACCENT_LIGHT}" stop-opacity="0.28"/>
<stop offset="0.6" stop-color="${ACCENT_REGULAR}" stop-opacity="0.08"/>
<stop offset="1" stop-color="${ACCENT_REGULAR}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="coolshadow" gradientUnits="userSpaceOnUse" cx="120" cy="90" r="720">
<stop offset="0" stop-color="${SLATE}" stop-opacity="0.5"/>
<stop offset="1" stop-color="${SLATE}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="node">
<stop offset="0" stop-color="${GLOW}" stop-opacity="0.55"/>
<stop offset="1" stop-color="${GLOW}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="current">
<stop offset="0" stop-color="${ACCENT_LIGHT}" stop-opacity="0.26"/>
<stop offset="1" stop-color="${ACCENT_LIGHT}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="filament" gradientUnits="userSpaceOnUse" x1="620" y1="540" x2="1420" y2="400">
<stop offset="0" stop-color="${ACCENT_LIGHT}"/>
<stop offset="0.5" stop-color="${GLOW}"/>
<stop offset="1" stop-color="${PALE}"/>
</linearGradient>
${poolDefs}
<filter id="bloom" x="-25%" y="-25%" width="150%" height="150%">
<feGaussianBlur stdDeviation="22"/>
</filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" result="n"/>
<feColorMatrix in="n" type="saturate" values="0"/>
</filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#ground)"/>
<rect width="${W}" height="${H}" fill="url(#lift)"/>
<rect width="${W}" height="${H}" fill="url(#coolshadow)" style="mix-blend-mode:multiply"/>

<g style="mix-blend-mode:screen">
<ellipse cx="330" cy="492" rx="420" ry="118" fill="url(#current)" filter="url(#bloom)" opacity="0.5"/>
<g opacity="0.85">${buildParticles()}</g>
</g>

<g style="mix-blend-mode:screen" opacity="0.26" filter="url(#bloom)">${buildBasins()}</g>
<g style="mix-blend-mode:screen">${buildBasins()}</g>

<g style="mix-blend-mode:screen" opacity="0.45" filter="url(#bloom)">${buildFilaments()}</g>
<g style="mix-blend-mode:screen">${buildFilaments()}</g>

<g style="mix-blend-mode:screen">${buildNodes()}</g>

<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.055" style="mix-blend-mode:overlay"/>
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
			html,body{margin:0;padding:0;background:${ACCENT_DARK};overflow:hidden}
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
		await new Promise((r) => setTimeout(r, 700));
		const { data } = await cdp.send('Page.captureScreenshot', {
			format: 'jpeg',
			quality: 92,
			captureBeyondViewport: true,
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
console.log(`safe band for the 11rem card crop: y ${SAFE_TOP}–${SAFE_BOTTOM}`);
