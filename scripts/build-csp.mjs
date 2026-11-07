// Build a deployment-wide HTTP policy from the HTML that will actually ship.
// Hashes authorize only the exact inline blocks emitted by this trusted build.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';

const baseline = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";
const hash = text => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

export function inlineHashes(html) {
  const scripts = new Set(), styles = new Set();
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
    if (Object.keys(attrs).some(name => /^on/i.test(name))) throw new Error('Inline event handlers are not allowed.');
    if (Object.values(attrs).some(value => /^\s*javascript:/i.test(value))) throw new Error('JavaScript URLs are not allowed.');
    if (node.tagName === 'style' || (node.tagName === 'script' && !attrs.src)) {
      const text = (node.childNodes ?? []).filter(child => child.nodeName === '#text').map(child => child.value).join('');
      if (text) (node.tagName === 'script' ? scripts : styles).add(hash(text));
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  // A noscript style in <head> is parsed differently when scripting is disabled.
  // Cover both browser modes without permitting arbitrary inline style blocks.
  for (const scriptingEnabled of [true, false]) visit(parse(html, { scriptingEnabled }));
  return { scripts, styles };
}

export function contentPolicy(scripts, styles) {
  return [
    "default-src 'self'",
    `script-src 'self' https://static.cloudflareinsights.com ${[...scripts].sort().join(' ')}`.trim(),
    "script-src-attr 'none'",
    `style-src 'self' https://fonts.googleapis.com ${[...styles].sort().join(' ')}`.trim(),
    // Existing SVGs and browser animation code use style attributes.
    // This exception does not permit inline JavaScript or arbitrary <style> blocks.
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self' https://d2ol7oe51mr4n9.cloudfront.net",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-src 'none'",
    "worker-src 'none'",
    "form-action 'none'",
    baseline,
  ].join('; ');
}

export async function buildCsp(directory = 'dist', { reportOnly = false } = {}) {
  const scripts = new Set(), styles = new Set();
  let count = 0;
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = join(folder, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const found = inlineHashes(await readFile(file, 'utf8'));
        found.scripts.forEach(value => scripts.add(value));
        found.styles.forEach(value => styles.add(value));
        count++;
      }
    }
  }
  await visit(resolve(directory));
  if (!count) throw new Error('Build the HTML pages before generating the content policy.');
  const file = join(directory, '_headers');
  const headers = await readFile(file, 'utf8');
  if ((headers.match(/^  Content-Security-Policy:/gm) ?? []).length !== 1) throw new Error('Expected one global content-policy template.');
  const policy = contentPolicy(scripts, styles);
  const line = reportOnly
    ? `  Content-Security-Policy: ${baseline}\n  Content-Security-Policy-Report-Only: ${policy}`
    : `  Content-Security-Policy: ${policy}`;
  const generated = headers.replace(/^  Content-Security-Policy-Report-Only:.*\n?/gm, '').replace(/^  Content-Security-Policy:.*$/m, line);
  if (generated.split('\n').some(value => value.length > 2000)) throw new Error('Content policy exceeds the Cloudflare header-line limit; split policies by route.');
  await writeFile(file, generated);
  return { pages: count, scripts: scripts.size, styles: styles.size, reportOnly };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  buildCsp(process.argv[2] ?? 'dist', { reportOnly: process.argv.includes('--report-only') })
    .then(result => console.log(`Content policy generated: ${JSON.stringify(result)}`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

