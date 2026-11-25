/**
 * Stub for the `server-only` marker package.
 *
 * Next resolves `import "server-only"` through its own bundler, so it needs no
 * entry in package.json. Vitest has no such aliasing, and importing a module
 * that carries the marker failed to resolve it. The real package exports
 * nothing and exists purely to make a client-side import a build error, so an
 * empty module is a faithful stand-in under test.
 */
export {};
