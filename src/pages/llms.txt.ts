// /llms.txt — a plain-text index of this site for AI assistants, in the format proposed at
// llmstxt.org. Generated at build time, never hand-written: the identity lines come from
// src/lib/identity.ts and the Work list from the work collection, so it cannot drift from the
// pages it describes. Adding a case study adds its line here on the next build.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { identity } from '../lib/identity';

export const GET: APIRoute = async ({ site }) => {
	const url = (path: string) => new URL(path, site).href;

	const work = (await getCollection('work'))
		.sort((a, b) => a.data.title.localeCompare(b.data.title))
		.map((entry) => {
			const description = entry.data.description.replace(/\s+/g, ' ').trim();
			return `- [${entry.data.title}](${url(`/work/${entry.id}/`)}): ${description}`;
		});

	const body = [
		`# ${identity.name}`,
		'',
		`> ${identity.oneLine}`,
		'',
		identity.tagline,
		'',
		'## Pages',
		'',
		`- [Home](${url('/')}): Introduction and selected work.`,
		`- [About](${url('/about/')}): Background, the six capabilities I work from, and my career arc.`,
		`- [Work](${url('/work/')}): All case studies.`,
		'',
		'## Work',
		'',
		...work,
		'',
		'## Contact',
		'',
		`- Email: ${identity.contact.email}`,
		`- [LinkedIn](${identity.contact.linkedin})`,
		`- [GitHub](${identity.contact.github})`,
		'',
	].join('\n');

	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
