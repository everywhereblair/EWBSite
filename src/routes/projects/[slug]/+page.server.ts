import { error } from '@sveltejs/kit';
import { list, view } from '$lib/server/content';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => list('project').map((e) => ({ slug: e.slug }));

export const load: PageServerLoad = ({ params }) => {
	const v = view('project', params.slug);
	if (!v) error(404, 'Not found');
	return v;
};
