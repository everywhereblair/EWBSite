import { error } from '@sveltejs/kit';
import { view } from '$lib/server/content';

export const load = () => {
	const v = view('page', 'about');
	if (!v) error(404, 'About page missing: add src/content/pages/about.md');
	return v;
};
