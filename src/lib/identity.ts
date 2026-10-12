// The canonical identity strings, in one place. The wiki's style/positioning.md is the source of
// truth; this file is the site's single copy of it. The home page hero, the About page description
// and /llms.txt all read from here, so a positioning change is one edit, and the sync-positioning
// check has one file to compare.

export const identity = {
	name: 'Mike Cirrotti',
	title: 'AI Opportunity Translator',
	tagline:
		'Aligning emerging technology to where it creates business value. Fluent both directions — strategy and build.',
	oneLine:
		'AI Opportunity Translator living in the gap between what organizations know and what AI can build.',
	contact: {
		email: 'mikecirrotti@gmail.com',
		linkedin: 'https://www.linkedin.com/in/mikecirrotti',
		github: 'https://github.com/mikecirrotti',
	},
} as const;
