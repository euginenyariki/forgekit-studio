/**
 * Programmatic entry point of `@forgekit/cli`.
 *
 * Exposes the same `run` used by the `forgekit` binary so other tools (the
 * integration tests, for example) can drive the CLI in-process.
 */
export { run, EXIT } from './cli.js';
export { parseArgs, CliArgumentError, type ParsedArgs } from './args.js';
export { processIO, recordingIO, type CliIO } from './io.js';
export { parseConfigPairs } from './config-values.js';
