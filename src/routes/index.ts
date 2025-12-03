/**
 * Route exports for Color Name API
 */

export { default as colors, initColorsRoute } from './colors';
export { default as names, initNamesRoute } from './names';
export { default as lists, initListsRoute } from './lists';
export { default as swatch } from './swatch';
export { default as docs, initDocsRoute, getOpenApiJSONObject, getOpenApiYAMLString } from './docs';
export { default as wellKnown } from './wellKnown';
