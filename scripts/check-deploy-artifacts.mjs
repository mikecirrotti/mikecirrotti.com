// Reject sensitive files before Astro copies public/ and before dist/ is published.
// Diagnostics contain paths and categories, never matched credential values.
import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const privateDirectories = new Set(['.git', '.hg', '.svn', '.ssh', '.aws', '.azure', '.config', 'node_modules']);
const privateNames = new Set(['.npmrc', '.netrc', '.pypirc', 'credentials', 'id_rsa', 'id_ed25519', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb']);
const privateExtension = /\.(?:pem|key|p12|pfx|sql|sqlite3?|db|dump|bak|backup|old|orig|swp|zip|tar|tgz|7z|rar)$/i;
const sourceExtension = /\.(?:astro|tsx?|jsx|mdx?|map)$/i;
const signatures = [
  ['private key', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['provider API key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}\b/],
];

async function contentProblem(file) {
  let tail = '';
  for await (const chunk of createReadStream(file, { encoding: 'utf8' })) {
    const text = tail + chunk;
    for (const [label, pattern] of signatures) if (pattern.test(text)) return label;
    tail = text.slice(-512);
  }
  return null;
}

export async function checkDeployArtifacts(directory, { require404 = false } = {}) {
  const root = resolve(directory);
  // A symlinked root could turn a safe-looking directory into an unintended upload.
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('Artifact directory must be a real directory.');
  const problems = [];
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = join(folder, entry.name);
      const path = relative(root, file).split('\\').join('/');
      const name = entry.name.toLowerCase();
      if (entry.isSymbolicLink()) { problems.push(`${path}: symbolic link`); continue; }
      if (entry.isDirectory()) {
        if (privateDirectories.has(name)) problems.push(`${path}: private or dependency directory`);
        else await visit(file);
      } else if (entry.isFile()) {
        if (/^\.env(?:\.|$)/i.test(name) || privateNames.has(name) || privateExtension.test(name) || /~$/.test(name)) {
          problems.push(`${path}: sensitive or unintended deployment file`);
        } else if (sourceExtension.test(name)) {
          problems.push(`${path}: source file or source map`);
        } else {
          const reason = await contentProblem(file);
          if (reason) problems.push(`${path}: possible ${reason}`);
        }
      } else problems.push(`${path}: unsupported file type`);
    }
  }
  await visit(root);
  if (require404) {
    const page = join(root, '404.html');
    try {
      const info = await lstat(page);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error();
      const html = await readFile(page, 'utf8');
      if (!/<meta\s+[^>]*name=["']robots["'][^>]*content=["']noindex["']/i.test(html)) problems.push('404.html: missing noindex metadata');
    } catch { problems.push('404.html: missing regular error page; Cloudflare could serve the homepage for unknown paths'); }
    for (const file of await readdir(root)) {
      if (!/^sitemap.*\.xml$/i.test(file)) continue;
      const xml = await readFile(join(root, file), 'utf8');
      if (/<loc>[^<]*\/404(?:\.html)?\/?<\/loc>/i.test(xml)) problems.push(`${basename(file)}: error page must not be in the sitemap`);
    }
  }
  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = process.argv[2];
  if (!directory) { console.error('Usage: node scripts/check-deploy-artifacts.mjs <directory> [--require-404]'); process.exitCode = 1; }
  else checkDeployArtifacts(directory, { require404: process.argv.includes('--require-404') })
    .then(problems => {
      if (problems.length) { console.error(`Deployment artifact check failed:\n${problems.join('\n')}`); process.exitCode = 1; }
      else console.log(`Deployment artifact check passed: ${directory}.`);
    })
    .catch(() => { console.error('Deployment artifact check could not read the requested directory.'); process.exitCode = 1; });
}

