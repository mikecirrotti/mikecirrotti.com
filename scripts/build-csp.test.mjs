import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inlineHashes, buildCsp } from './build-csp.mjs';

const hash = text => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
const headers = "/*\n  Cache-Control: public, no-cache\n  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'\n\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n";
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'site-csp-'));
  try { await writeFile(join(root, '_headers'), headers); return await run(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

test('hashes exact inline contents, including no-script fallback styles', () => {
  const script = '  const value = "<test>";\n';
  const fallback = '.fallback { display: block; }';
  const found = inlineHashes(`<head><noscript><style>${fallback}</style></noscript></head><body><script>${script}</script><script src="/app.js"></script></body>`);
  assert.ok(found.scripts.has(hash(script)));
  assert.ok(!found.scripts.has(hash(script.trim())));
  assert.ok(found.styles.has(hash(fallback)));
  assert.equal(found.scripts.size, 1);
});

test('rejects executable attributes and JavaScript URLs instead of weakening the policy', () => {
  assert.throws(() => inlineHashes('<button onclick="alert(1)">Go</button>'), /event handlers/);
  assert.throws(() => inlineHashes('<a href="javascript:alert(1)">Go</a>'), /JavaScript URLs/);
});

test('aggregates nested routes, keeps cache rules, and replaces report-only mode cleanly', async () => {
  await fixture(async root => {
    await mkdir(join(root, 'about'));
    await writeFile(join(root, 'index.html'), '<script>const home = 1;</script><style>.home{color:green}</style>');
    await writeFile(join(root, 'about', 'index.html'), '<script>const about = 2;</script>');
    const result = await buildCsp(root, { reportOnly: true });
    assert.equal(result.pages, 2); assert.equal(result.scripts, 2);
    let output = await readFile(join(root, '_headers'), 'utf8');
    assert.match(output, /Content-Security-Policy-Report-Only:/);
    assert.ok(output.includes(hash('const home = 1;')) && output.includes(hash('const about = 2;')));
    await buildCsp(root);
    output = await readFile(join(root, '_headers'), 'utf8');
    assert.ok(!output.includes('Report-Only'));
    assert.equal((output.match(/Content-Security-Policy:/g) ?? []).length, 1);
    assert.match(output, /script-src-attr 'none'/);
    assert.match(output, /style-src-attr 'unsafe-inline'/);
    assert.ok(output.includes("media-src 'self' https://d2ol7oe51mr4n9.cloudfront.net;"), 'Published podcast audio must remain allowed without permitting every external host');
    assert.ok(!/script-src [^;]*(?:unsafe-inline|unsafe-eval)/.test(output));
    assert.ok(output.includes('max-age=31536000, immutable'));
  });
});

test('fails closed for missing HTML and policies too large for Cloudflare', async () => {
  await fixture(async root => {
    await assert.rejects(buildCsp(root), /Build the HTML/);
    await writeFile(join(root, 'index.html'), Array.from({ length: 40 }, (_, i) => `<script>const value${i} = ${i};</script>`).join(''));
    await assert.rejects(buildCsp(root), /header-line limit/);
  });
});

