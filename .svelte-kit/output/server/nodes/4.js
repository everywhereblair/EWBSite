

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/writing/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/4.K6e5K-OM.js","_app/immutable/chunks/BG66uVZi.js","_app/immutable/chunks/xihTtKlq.js"];
export const stylesheets = [];
export const fonts = [];
