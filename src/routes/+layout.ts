// Every page is static HTML built at deploy time. The prerender crawler also
// fails the build on broken internal links, which gives free link checking.
export const prerender = true;
export const trailingSlash = 'never';
