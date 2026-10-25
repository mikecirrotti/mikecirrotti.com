// The canonical identity strings, in one place. The wiki's style/positioning.md is the source of
// truth; this file is the site's single copy of it. The home page hero, the About page description
// and /llms.txt all read from here, so a positioning change is one edit, and the sync-positioning
// check has one file to compare.

export const identity = {
	name: 'Mike Cirrotti',
	title: 'AI Product Strategy & Delivery',
	tagline:
		'Turning business problems into useful data and AI solutions with multidisciplinary teams.',
	footer: 'AI product strategy and delivery, grounded in analytics and insurance.',
	oneLine:
		'AI product strategy and delivery, grounded in analytics, insurance expertise, and multidisciplinary team leadership.',
	contact: {
		email: 'mikecirrotti@gmail.com',
		linkedin: 'https://www.linkedin.com/in/mikecirrotti',
		github: 'https://github.com/mikecirrotti',
	},
} as const;
