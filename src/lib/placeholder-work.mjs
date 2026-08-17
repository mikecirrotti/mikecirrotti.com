/**
 * Finds the work entries that are still unfinished placeholders.
 *
 * ── If you are publishing a real case study, read this ──────────────────────
 *
 * A work entry is treated as a placeholder purely because its frontmatter
 * carries the `Placeholder` tag. Placeholders are kept out of the sitemap, so
 * the site never submits "Coming soon" lorem ipsum to search engines and AI
 * crawlers as pages worth indexing.
 *
 * There is no list of slugs anywhere to maintain. Drop the `Placeholder` tag
 * from an entry's frontmatter and it enters the sitemap on the next build.
 * That is the whole handover: publish the case study, remove the tag.
 *
 * Every build prints which entries were excluded, so this can't rot quietly.
 *
 * Read from disk rather than via `astro:content` because `astro.config.mjs`
 * is evaluated before the content layer exists.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORK_DIR = fileURLToPath(new URL('../content/work/', import.meta.url));
const PLACEHOLDER_TAG = 'placeholder';

/** Every .md file under src/content/work, as a collection id ("nested/duvet-genius"). */
function collectionIds(dir = WORK_DIR, prefix = '') {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) {
			return collectionIds(join(dir, entry.name), `${prefix}${entry.name}/`);
		}
		return entry.name.endsWith('.md') ? [`${prefix}${entry.name.slice(0, -3)}`] : [];
	});
}

/** Frontmatter `tags:`, lowercased. Handles block (`- AI`) and inline (`[AI]`) lists, and comments. */
function tagsOf(source) {
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!frontmatter) return [];

	const lines = frontmatter[1].split(/\r?\n/);
	const start = lines.findIndex((line) => /^tags:/.test(line));
	if (start === -1) return [];

	const inline = lines[start].match(/^tags:[ \t]*\[(.*)\]/);
	const tags = inline ? inline[1].split(',') : [];

	for (const line of lines.slice(start + 1)) {
		if (/^[ \t]*(#|$)/.test(line)) continue; // comment or blank line
		const item = line.match(/^[ \t]+-[ \t]*(.*)$/);
		if (!item) break; // dedented — next frontmatter key
		tags.push(item[1]);
	}

	return tags
		.map((tag) => tag.replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, '').toLowerCase())
		.filter(Boolean);
}

/** Site paths of unfinished work entries, e.g. ["/work/h20/"]. */
export function placeholderWorkPaths() {
	return collectionIds()
		.filter((id) => tagsOf(readFileSync(join(WORK_DIR, `${id}.md`), 'utf8')).includes(PLACEHOLDER_TAG))
		.map((id) => `/work/${id}/`);
}
