#!/usr/bin/env node
/**
 * Responsive layout audit for mikecirrotti.com.
 *
 * Captures full-page screenshots across a device-width matrix (light + dark themes)
 * and runs programmatic layout diagnostics:
 *   - horizontal overflow (elements extending past the viewport)
 *   - container escape (content extending past a bordered/shadowed container)
 *   - nav variant at each width (hamburger vs pill nav), to catch CSS/JS breakpoint drift
 *
 * Usage:
 *   node .claude/skills/responsive-audit/scripts/audit.mjs [--base http://localhost:4321] [--out .responsive-audit]
 *     [--widths 360,1440]   subset of widths for a quick targeted run
 *     [--pages /,/work/]    subset of pages (comma-separated routes)
 *
 * Requires: playwright-core (`npm i --no-save playwright-core`) and a Chromium/Chrome
 * binary (auto-detected; override with CHROME_PATH). Run `npm run build` and
 * `npx astro preview --port 4321` first — pages are discovered from dist/.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(join(process.cwd(), 'noop.js'));
let chromium;
try {
	({ chromium } = require('playwright-core'));
} catch {
	try {
		({ chromium } = require('playwright'));
	} catch {
		console.error('playwright-core not found. Run: npm i --no-save playwright-core');
		process.exit(1);
	}
}

const args = process.argv.slice(2);
const argVal = (flag, dflt) => {
	const i = args.indexOf(flag);
	return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const BASE = argVal('--base', 'http://localhost:4321').replace(/\/$/, '');
const OUT = argVal('--out', '.responsive-audit');

// ---------------------------------------------------------------- browser lookup
function* chromeCandidates() {
	if (process.env.CHROME_PATH) yield process.env.CHROME_PATH;
	const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache/ms-playwright'), join(homedir(), 'Library/Caches/ms-playwright')].filter(Boolean);
	for (const root of roots) {
		if (!existsSync(root)) continue;
		for (const dir of readdirSync(root).filter((d) => d.startsWith('chromium')).sort().reverse()) {
			yield join(root, dir, 'chrome-linux', 'chrome');
			yield join(root, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
		}
	}
	yield '/opt/pw-browsers/chromium';
	yield '/usr/bin/chromium';
	yield '/usr/bin/chromium-browser';
	yield '/usr/bin/google-chrome';
	yield '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

async function launchBrowser() {
	for (const p of chromeCandidates()) {
		if (existsSync(p)) {
			try {
				return await chromium.launch({ executablePath: p });
			} catch {}
		}
	}
	// Last resorts: playwright's own registry, then an installed branded Chrome.
	try {
		return await chromium.launch();
	} catch {}
	return await chromium.launch({ channel: 'chrome' });
}

// ---------------------------------------------------------------- page discovery
function discoverPages() {
	const dist = join(process.cwd(), 'dist');
	if (!existsSync(dist)) {
		console.warn('dist/ not found (run `npm run build`); falling back to core pages.');
		return ['/', '/work/', '/about/'];
	}
	const pages = [];
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) walk(join(dir, entry.name));
			else if (entry.name === 'index.html') {
				const route = '/' + relative(dist, dir).split('\\').join('/');
				pages.push(route === '/.' || route === '/' ? '/' : route.replace(/\/?$/, '/'));
			}
		}
	};
	walk(dist);
	return [...new Set(pages)].sort();
}

// ---------------------------------------------------------------- diagnostics
// Runs inside the page. Returns overflow + container-escape findings and nav state.
function inspect(viewportWidth) {
	const findings = { horizontalOverflow: [], containerEscape: [], nav: null };
	const label = (el) => {
		const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : '';
		return `${el.tagName.toLowerCase()}${cls}`;
	};

	if (document.documentElement.scrollWidth > viewportWidth) {
		findings.horizontalOverflow.push(`document scrollWidth=${document.documentElement.scrollWidth} > viewport=${viewportWidth}`);
	}
	for (const el of document.querySelectorAll('body *')) {
		const r = el.getBoundingClientRect();
		if (r.width === 0 || r.height === 0) continue;
		if (r.right > viewportWidth + 1 || r.left < -1) {
			findings.horizontalOverflow.push(`${label(el)} left=${Math.round(r.left)} right=${Math.round(r.right)} "${(el.textContent || '').trim().slice(0, 40)}"`);
		}
	}

	// Container escape: visual containers (border or shadow, overflow visible) whose
	// descendants extend past their bottom edge. Heuristic — verify hits in screenshots.
	for (const el of document.querySelectorAll('body *')) {
		const cs = getComputedStyle(el);
		const isContainer = (cs.borderTopWidth !== '0px' || cs.boxShadow !== 'none') && cs.overflow === 'visible' && cs.overflowY === 'visible';
		if (!isContainer) continue;
		const box = el.getBoundingClientRect();
		if (box.height < 20) continue;
		// Threshold is 2px per edge: centered content splits its overflow between
		// top and bottom, so a per-edge check with a tight threshold is needed to
		// catch e.g. an 8px-total overflow in a vertically centered card.
		for (const child of el.querySelectorAll('*')) {
			const cr = child.getBoundingClientRect();
			const escapes = cr.height > 0 && (cr.bottom > box.bottom + 2 || cr.top < box.top - 2);
			if (escapes && getComputedStyle(child).position === 'static') {
				findings.containerEscape.push(`${label(child)} top=${Math.round(cr.top)}/bottom=${Math.round(cr.bottom)} escapes ${label(el)} top=${Math.round(box.top)}/bottom=${Math.round(box.bottom)} "${(child.textContent || '').trim().slice(0, 50)}"`);
				break;
			}
		}
	}

	const burger = document.querySelector('.menu-button');
	const burgerVisible = burger && !burger.hidden && burger.getBoundingClientRect().width > 0;
	const pillNav = document.querySelector('.nav-items');
	const pillVisible = pillNav && pillNav.getBoundingClientRect().width > 0 && getComputedStyle(pillNav).flexDirection === 'row';
	findings.nav = burgerVisible && pillVisible ? 'BOTH (bug!)' : burgerVisible ? 'hamburger' : pillVisible ? 'pill' : 'NEITHER (bug!)';
	return findings;
}

// ---------------------------------------------------------------- main
const widthsArg = argVal('--widths', null);
const WIDTHS = widthsArg ? widthsArg.split(',').map(Number) : [320, 360, 390, 768, 1024, 1440];
const BREAKPOINT_EDGES = widthsArg ? [] : [767, 768, 799, 800]; // nav-state probe only, no screenshots
// Screenshots: light theme at every width; dark theme at phone + laptop reference widths.
const DARK_WIDTHS = widthsArg ? [] : [390, 1440];

const pagesArg = argVal('--pages', null);
const pages = pagesArg ? pagesArg.split(',').map((p) => (p.endsWith('/') || p === '/' ? p : p + '/')) : discoverPages();
console.log(`Auditing ${BASE} — ${pages.length} pages: ${pages.join(' ')}`);
const browser = await launchBrowser();
const summary = { base: BASE, generatedAt: new Date().toISOString(), pages: {}, navByWidth: {}, issues: [] };

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').split('/').join('-'));

for (const theme of ['light', 'dark']) {
	const widths = theme === 'light' ? WIDTHS : DARK_WIDTHS;
	for (const width of widths) {
		// NOTE: no isMobile — Chrome mobile emulation distorts tall full-page captures
		// via text autosizing and fakes horizontal-overflow bugs. See SKILL.md.
		const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
		const page = await ctx.newPage();
		for (const path of pages) {
			await page.goto(BASE + path, { waitUntil: 'networkidle' });
			// Scroll pass so loading="lazy" images render before capture.
			await page.evaluate(async () => {
				for (let y = 0; y < document.body.scrollHeight; y += 400) {
					window.scrollTo(0, y);
					await new Promise((r) => setTimeout(r, 30));
				}
				window.scrollTo(0, 0);
			});
			await page.waitForTimeout(400);
			const dir = join(OUT, theme, String(width));
			mkdirSync(dir, { recursive: true });
			const shot = join(dir, `${slug(path)}.png`);
			await page.screenshot({ path: shot, fullPage: true });

			if (theme === 'light') {
				const findings = await page.evaluate(inspect, width);
				const key = `${path} @${width}`;
				summary.pages[key] = findings;
				for (const f of findings.horizontalOverflow) summary.issues.push(`[overflow] ${key}: ${f}`);
				for (const f of findings.containerEscape) summary.issues.push(`[escape] ${key}: ${f}`);
				if (findings.nav.includes('bug')) summary.issues.push(`[nav] ${key}: ${findings.nav}`);
			}
		}
		await ctx.close();
		console.log(`  captured ${theme} @${width}px`);
	}
}

// Breakpoint-edge nav probe on the home page.
for (const width of BREAKPOINT_EDGES) {
	const ctx = await browser.newContext({ viewport: { width, height: 900 } });
	const page = await ctx.newPage();
	await page.goto(BASE + '/', { waitUntil: 'networkidle' });
	await page.waitForTimeout(200);
	const { nav } = await page.evaluate(inspect, width);
	summary.navByWidth[width] = nav;
	if (nav.includes('bug')) summary.issues.push(`[nav] / @${width}: ${nav}`);
	await ctx.close();
}

await browser.close();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));

console.log(`\nNav state by width: ${JSON.stringify(summary.navByWidth)}`);
if (summary.issues.length === 0) {
	console.log('\nNo programmatic issues detected. Now review the screenshots — composition problems are not machine-detectable.');
} else {
	console.log(`\n${summary.issues.length} finding(s):`);
	for (const i of summary.issues) console.log('  ' + i);
	console.log('\nVerify each in the matching screenshot before reporting (container-escape is a heuristic).');
}
console.log(`\nScreenshots + summary.json in ${OUT}/`);
