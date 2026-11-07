// Read-only checks against our Cloudflare preview. Never print response bodies:
// an unexpected response to a sensitive-file probe must not leak into CI logs.
import { inlineHashes } from './build-csp.mjs';
const projectHost = 'mikecirrotti-com.pages.dev';

async function previewFromGitHub() {
  const { GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GH_TOKEN: token } = process.env;
  if (!repository || !sha || !token) throw new Error('Preview discovery requires GitHub CI context.');
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(`https://api.github.com/repos/${repository}/commits/${sha}/check-runs`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Preview discovery failed: HTTP ${response.status}.`);
    const { check_runs: checks } = await response.json();
    const check = checks.find(item => item.name === 'Cloudflare Pages' && item.app?.slug === 'cloudflare-workers-and-pages');
    if (check?.status === 'completed') {
      if (check.conclusion !== 'success') throw new Error('Cloudflare preview deployment did not succeed.');
      const match = check.output?.summary?.match(/https:\/\/[a-f0-9]{8}\.mikecirrotti-com\.pages\.dev\b/);
      if (!match) throw new Error('Cloudflare did not provide an immutable preview URL.');
      return match[0];
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error('Cloudflare preview was not ready within five minutes.');
}

async function request(base, path, method = 'GET') {
  let url = new URL(path, base);
  for (let attempt = 0; attempt < 5; attempt++) {
    if (url.origin !== base.origin) throw new Error(`${path}: unexpected cross-origin redirect.`);
    const response = await fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const destination = response.headers.get('location');
      await response.body?.cancel();
      if (!destination) throw new Error(`${path}: redirect without a destination.`);
      url = new URL(destination, url);
    } else return response;
  }
  throw new Error(`${path}: too many redirects.`);
}

function checkHeaders(response, path) {
  const headers = response.headers;
  const policy = headers.get('content-security-policy') ?? '';
  for (const directive of ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"]) {
    if (!policy.includes(directive)) throw new Error(`${path}: missing content-policy restriction.`);
  }
  if (headers.get('x-frame-options')?.toUpperCase() !== 'DENY') throw new Error(`${path}: framing restriction missing or conflicting.`);
  if (headers.get('x-content-type-options') !== 'nosniff') throw new Error(`${path}: MIME-type protection missing or conflicting.`);
  if (headers.get('referrer-policy') !== 'strict-origin-when-cross-origin') throw new Error(`${path}: referrer policy missing or conflicting.`);
  const permissions = headers.get('permissions-policy') ?? '';
  for (const feature of ['camera=()', 'microphone=()', 'geolocation=()']) {
    if (!permissions.includes(feature)) throw new Error(`${path}: unused browser feature is not restricted.`);
  }
  if (headers.has('content-security-policy-report-only')) throw new Error(`${path}: report-only policy is not release acceptance.`);
  const full = policy;
  for (const directive of ["default-src 'self'", "script-src-attr 'none'", "style-src-attr 'unsafe-inline'", "font-src 'self' https://fonts.gstatic.com", "media-src 'self' https://d2ol7oe51mr4n9.cloudfront.net", "connect-src 'self' https://cloudflareinsights.com"]) {
    if (!full.includes(directive)) throw new Error(`${path}: full script/style policy is missing.`);
  }
  if (/script-src [^;]*(?:unsafe-inline|unsafe-eval)/.test(full)) throw new Error(`${path}: script policy is too permissive.`);
  return full;
}

function checkInlinePolicy(html, policy, path) {
  const hashes = inlineHashes(html);
  for (const value of [...hashes.scripts, ...hashes.styles]) {
    if (!policy.includes(value)) throw new Error(`${path}: a delivered inline block lacks its content-policy hash.`);
  }
}

try {
  const address = process.argv[2] === '--from-github' ? await previewFromGitHub() : process.argv[2];
  const base = new URL(address);
  if (base.protocol !== 'https:' || !base.hostname.endsWith(`.${projectHost}`) || base.username || base.password || base.port) {
    throw new Error('Hosted checks accept only this project’s HTTPS preview hosts.');
  }
  for (const path of ['/missing-page-check-20261106/', '/config/app/.env', '/api/v2/.env', '/server-info.php']) {
    const response = await request(base, path);
    if (response.status !== 404) { await response.body?.cancel(); throw new Error(`${path}: expected HTTP 404; received ${response.status}.`); }
    const policy = checkHeaders(response, path);
    const html = await response.text();
    checkInlinePolicy(html, policy, path);
    if (!response.headers.get('content-type')?.includes('text/html') || !/<h1[^>]*>Page not found<\/h1>/.test(html) || !html.includes('Views are my own, not my employer’s.')) {
      throw new Error(`${path}: expected the shared error-page HTML.`);
    }
    console.log(`Verified 404, error-page content, and security headers: ${path}`);
  }
  for (const path of ['/', '/about/', '/work/', '/work/the-harness/']) {
    const response = await request(base, path);
    if (response.status !== 200) { await response.body?.cancel(); throw new Error(`${path}: expected HTTP 200; received ${response.status}.`); }
    const policy = checkHeaders(response, path);
    const html = await response.text();
    checkInlinePolicy(html, policy, path);
    if (!response.headers.get('content-type')?.includes('text/html') || !html.includes('Views are my own, not my employer’s.')) throw new Error(`${path}: expected site HTML.`);
    console.log(`Verified valid page and security headers: ${path}`);
  }
  for (const [path, type] of [['/assets/portrait.jpg', 'image/jpeg']]) {
    const response = await request(base, path, 'HEAD');
    if (response.status !== 200 || !response.headers.get('content-type')?.includes(type)) throw new Error(`${path}: expected the original media asset.`);
    checkHeaders(response, path);
    console.log(`Verified media response and security headers: ${path}`);
  }
  for (const [path, type] of [['/resume.json', 'application/json'], ['/llms.txt', 'text/plain']]) {
    const response = await request(base, path);
    if (response.status !== 200 || !response.headers.get('content-type')?.includes(type)) throw new Error(`${path}: expected structured career content.`);
    checkHeaders(response, path);
    const text = await response.text();
    if (path === '/resume.json') {
      if (JSON.parse(text).basics?.name !== 'Mike Cirrotti') throw new Error('Unexpected resume content.');
    } else if (!text.startsWith('# Mike Cirrotti')) throw new Error('Unexpected AI index content.');
    console.log(`Verified machine-readable response: ${path}`);
  }
  console.log(`Hosted preview checks passed: ${base.origin}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

