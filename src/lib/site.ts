// Site-wide constants. One place to change the name, URL, or social links.
export const SITE = {
	name: 'EverywhereBlair',
	author: 'Blair Williams',
	url: 'https://everywhereblair.com',
	description:
		'Blair Williams writes about how he uses LLMs to solve real problems: workflows, case studies, and the systems behind them.',
	links: {
		bluesky: 'https://bsky.app/profile/everywhereblair.bsky.social',
		github: 'https://github.com/everywhereblair',
		book: 'https://a.co/d/04Js0G66'
	}
} as const;

export type ContentType = 'article' | 'project' | 'page';

/** URL prefix for each content type. Pages (e.g. about) live at the root. */
export const SECTION: Record<ContentType, string> = {
	article: '/writing',
	project: '/projects',
	page: ''
};
