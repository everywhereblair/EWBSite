import { card, list } from '$lib/server/content';

export const load = () => ({ entries: list('project').map(card) });
