import { card, list } from '$lib/server/content';

export const load = () => ({
	writing: list('article').slice(0, 5).map(card),
	projects: list('project').slice(0, 4).map(card),
	totalWriting: list('article').length
});
