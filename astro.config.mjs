// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import { placeholderWorkPaths } from './src/lib/placeholder-work.mjs';

// Work entries still tagged `Placeholder` are kept out of the sitemap — the site
// shouldn't hand search engines and AI crawlers a list of "Coming soon" pages and
// call them worth indexing. Nothing to clean up when a real case study ships:
// drop the `Placeholder` tag from its frontmatter and it appears here again.
// See src/lib/placeholder-work.mjs.
const excludedPaths = placeholderWorkPaths();

if (excludedPaths.length > 0) {
	console.info(
		`[sitemap] excluding ${excludedPaths.length} unpublished work ${
			excludedPaths.length === 1 ? 'entry' : 'entries'
		} still tagged Placeholder: ${excludedPaths.join(', ')}`,
	);
}

// https://astro.build/config
export default defineConfig({
	// Canonical origin. Required for sitemap URLs, absolute canonical links, and
	// the Sitemap: pointer in public/robots.txt.
	site: 'https://mikecirrotti.com',
	integrations: [
		sitemap({
			filter: (page) => !excludedPaths.some((path) => page.endsWith(path)),
		}),
	],
});
