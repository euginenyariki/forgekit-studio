/**
 * Client-safe entry point of `@forgekit/core`.
 *
 * Everything exported here is free of Node built-ins and bundler directives, so
 * it can be imported from React components and server action modules alike.
 * The root entry (`@forgekit/core`) adds filesystem-backed APIs on top.
 */
export * from './errors.js';
export * from './render.js';
export * from './schemas.js';
export * from './support.js';
export * from './template-config.js';
export * from './types.js';
export * from './validation.js';
