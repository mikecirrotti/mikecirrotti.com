import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { career } from '../data/resume';
import { identity } from '../lib/identity';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const projects = (await getCollection('work'))
    .filter((entry) => !entry.data.tags?.includes('Placeholder'))
    .sort((a, b) => a.data.title.localeCompare(b.data.title))
    .map((entry) => ({
      name: entry.data.title,
      summary: entry.data.description.replace(/\s+/g, ' ').trim(),
      url: url(`/work/${entry.id}/`),
      keywords: entry.data.tags,
    }));

  const resume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/jsonresume.org/bbb5e169def0f93d88285d5a220787a7328408c6/packages/schema/schema.json',
    basics: {
      name: identity.name,
      label: identity.title,
      image: url(identity.image),
      email: identity.contact.email,
      url: url('/'),
      summary: identity.oneLine,
      profiles: [
        { network: 'LinkedIn', username: 'mikecirrotti', url: identity.contact.linkedin },
        { network: 'GitHub', username: 'mikecirrotti', url: identity.contact.github },
      ],
    },
    ...career,
    projects,
    meta: { canonical: url('/resume.json') },
  };

  return new Response(JSON.stringify(resume, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
