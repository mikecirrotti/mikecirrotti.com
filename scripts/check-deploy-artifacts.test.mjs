import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkDeployArtifacts } from './check-deploy-artifacts.mjs';

const errorPage = '<!doctype html><meta name="robots" content="noindex"><h1>Page not found</h1>';
async function fixture(files, run) {
  const root = await mkdtemp(join(tmpdir(), 'deploy-artifacts-'));
  try {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), content);
    }
    return await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('allows site assets, JSON, hosting files, and .well-known', async () => {
  await fixture({ '404.html': errorPage, '_headers': '/*\n  X-Frame-Options: DENY', '_astro/app.js': 'const x = 1;', 'data.json': '{}', '.well-known/security.txt': 'Contact: mailto:security@example.com', 'images/a.svg': '<svg/>', 'sitemap-0.xml': '<loc>https://example.com/about/</loc>' }, async root => {
    assert.deepEqual(await checkDeployArtifacts(root, { require404: true }), []);
  });
});

test('rejects nested configuration, backups, private keys, source, and dependency files', async () => {
  const paths = ['config/app/.env', 'api/v2/.env.production', '.env.example', 'private.pem', 'data.sql', 'database.sqlite3', 'release.zip', 'index.html.bak', '.git/config', 'node_modules/pkg/index.js', 'package-lock.json', 'source.ts', 'app.js.map'];
  await fixture(Object.fromEntries(paths.map(path => [path, 'fixture'])), async root => {
    const problems = await checkDeployArtifacts(root);
    assert.equal(problems.length, paths.length);
    for (const path of paths) assert.ok(problems.some(problem => problem.startsWith(`${path}:`) || problem.startsWith(`${path.split('/')[0]}:`)), path);
  });
});

test('detects private-key contents under an innocent filename without disclosing the value', async () => {
  const marker = '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----';
  await fixture({ 'download.txt': marker + '\nprivate-fixture-content' }, async root => {
    const problems = await checkDeployArtifacts(root);
    assert.deepEqual(problems, ['download.txt: possible private key']);
    assert.ok(!problems.join('\n').includes('private-fixture-content'));
  });
});

test('rejects symlinks even when their names appear safe', async () => {
  await fixture({ 'index.html': '<h1>Home</h1>' }, async root => {
    await symlink(join(root, 'index.html'), join(root, 'public-copy.html'));
    assert.deepEqual(await checkDeployArtifacts(root), ['public-copy.html: symbolic link']);
  });
});

test('fails if the error page disappears, loses noindex, or enters the sitemap', async () => {
  await fixture({ 'index.html': '<h1>Home</h1>' }, async root => {
    assert.ok((await checkDeployArtifacts(root, { require404: true })).some(p => p.startsWith('404.html: missing regular')));
    await writeFile(join(root, '404.html'), '<h1>Not found</h1>');
    assert.deepEqual(await checkDeployArtifacts(root, { require404: true }), ['404.html: missing noindex metadata']);
    await writeFile(join(root, '404.html'), errorPage);
    await writeFile(join(root, 'sitemap-0.xml'), '<loc>https://example.com/404/</loc>');
    assert.deepEqual(await checkDeployArtifacts(root, { require404: true }), ['sitemap-0.xml: error page must not be in the sitemap']);
  });
});

test('CLI exits unsuccessfully for dangerous files and an unreadable directory', async () => {
  await fixture({ 'config/app/.env': 'fixture-only' }, async root => {
    const result = spawnSync(process.execPath, ['scripts/check-deploy-artifacts.mjs', root], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /config\/app\/\.env/);
    assert.ok(!result.stderr.includes('fixture-only'));
    const missing = spawnSync(process.execPath, ['scripts/check-deploy-artifacts.mjs', join(root, 'absent')], { encoding: 'utf8' });
    assert.equal(missing.status, 1);
  });
});

