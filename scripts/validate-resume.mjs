import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const schema = JSON.parse(readFileSync(new URL('scripts/resume.schema.json', root), 'utf8'));
const resumeText = readFileSync(new URL('dist/resume.json', root), 'utf8');
const resume = JSON.parse(resumeText);
const supported = new Set(['$schema', '$id', 'title', 'description', 'definitions', 'type', 'properties', 'additionalProperties', '$ref', 'items', 'oneOf', 'pattern', 'format']);

// Reject schema changes this small, pinned-schema validator does not understand.
function inspect(rule) {
  for (const key of Object.keys(rule)) assert(supported.has(key), `Unsupported schema keyword: ${key}`);
  for (const group of ['properties', 'definitions']) {
    for (const child of Object.values(rule[group] ?? {})) inspect(child);
  }
  if (rule.items) inspect(rule.items);
  if (typeof rule.additionalProperties === 'object') inspect(rule.additionalProperties);
  for (const child of rule.oneOf ?? []) inspect(child);
}
inspect(schema);

function check(value, rule, path = '$') {
  if (rule.$ref) {
    assert(rule.$ref.startsWith('#/'), 'Only local schema references are supported');
    rule = rule.$ref.slice(2).split('/').reduce((node, key) => node[key], schema);
  }
  if (rule.oneOf) {
    const matches = rule.oneOf.filter((option) => {
      try { check(value, option, path); return true; } catch { return false; }
    });
    assert.equal(matches.length, 1, `${path}: expected one schema alternative`);
  }
  if (rule.type === 'object') {
    assert(value !== null && typeof value === 'object' && !Array.isArray(value), `${path}: expected object`);
    for (const [key, child] of Object.entries(value)) {
      if (rule.properties?.[key]) check(child, rule.properties[key], `${path}.${key}`);
      else if (rule.additionalProperties === false) assert.fail(`${path}: unexpected ${key}`);
      else if (typeof rule.additionalProperties === 'object') check(child, rule.additionalProperties, `${path}.${key}`);
    }
  } else if (rule.type === 'array') {
    assert(Array.isArray(value), `${path}: expected array`);
    value.forEach((child, i) => check(child, rule.items, `${path}[${i}]`));
  } else if (rule.type) {
    assert.equal(typeof value, rule.type, `${path}: expected ${rule.type}`);
  }
  if (rule.pattern) assert(new RegExp(rule.pattern).test(value), `${path}: invalid date or pattern`);
  if (rule.format === 'uri') {
    assert(typeof value === 'string' && !/\s/.test(value), `${path}: invalid URI`);
    assert(new URL(value).protocol, `${path}: expected absolute URI`);
  } else if (rule.format === 'email') {
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), `${path}: invalid email`);
  } else if (rule.format) {
    assert.fail(`Unsupported schema format: ${rule.format}`);
  }
}
check(resume, schema);
assert.equal(resume.basics.url, 'https://mikecirrotti.com/');
assert.equal(resume.meta.canonical, 'https://mikecirrotti.com/resume.json');
const portrait = new URL(resume.basics.image);
assert.equal(portrait.origin, new URL(resume.basics.url).origin);
assert(existsSync(new URL('public' + portrait.pathname, root)), 'Portrait asset must exist');
const reportRole = resume.work.find((role) => role.custom?.mikecirrotti?.directReports);
assert(reportRole, 'Expected direct-report scope');
const reports = reportRole.custom.mikecirrotti.directReports;
assert.equal(reports.total, Object.values(reports.byRole).reduce((sum, count) => sum + count, 0));
assert.equal(reports.total, 7);
assert.equal(reports.scope, 'During part of the role');
assert(!/(engram-wiki-private|libfile_|Liberty Mutual|Solaria|Berkeley Research Group|\$25M|first production approval)/i.test(resumeText), 'Private or uncleared text in public resume');
assert(resume.work.every((role) => role.endDate !== 'Present'), 'Omit endDate for current work');
const llms = readFileSync(new URL('dist/llms.txt', root), 'utf8');
const about = readFileSync(new URL('dist/about/index.html', root), 'utf8');
const home = readFileSync(new URL('dist/index.html', root), 'utf8');
assert(llms.includes('https://mikecirrotti.com/resume.json'));
assert(about.includes('href="/resume.json"'));
assert(home.includes('href="/resume.json"'));
console.log(`Resume valid against pinned schema: ${resume.work.length} roles, ${resume.education.length} education entries, ${resume.projects.length} projects; links, portrait, public scope, and report counts passed.`);
