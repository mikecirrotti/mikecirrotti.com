// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// Canonical origin. Required for sitemap URLs, absolute canonical links, and
	// the Sitemap: pointer in public/robots.txt.
	site: 'https://mikecirrotti.com',
	integrations: [sitemap()],
});
