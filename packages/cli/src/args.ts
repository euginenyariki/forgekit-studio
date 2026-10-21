/** Raised when the raw command line cannot be understood. */
export class CliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliArgumentError';
  }
}

/** Normalized command line, independent of `process.argv`. */
export interface ParsedArgs {
  command: string | undefined;
  positionals: string[];
  template: string | undefined;
  dir: string | undefined;
  /** Raw `key=value` pairs from every `--config`/`-c` flag, in order. */
  config: string[];
  dryRun: boolean;
  overwrite: boolean;
  json: boolean;
  quiet: boolean;
  help: boolean;
  version: boolean;
}

/** Aliases that take a value. */
const VALUE_ALIASES: Record<string, 'template' | 'dir' | 'config'> = {
  '-t': 'template',
  '--template': 'template',
  '-d': 'dir',
  '--dir': 'dir',
  '-c': 'config',
  '--config': 'config',
};

/** Boolean aliases. */
const BOOLEAN_ALIASES: Record<
  string,
  keyof Pick<ParsedArgs, 'dryRun' | 'overwrite' | 'json' | 'quiet' | 'help' | 'version'>
> = {
  '--dry-run': 'dryRun',
  '--overwrite': 'overwrite',
  '--json': 'json',
  '-q': 'quiet',
  '--quiet': 'quiet',
  '-h': 'help',
  '--help': 'help',
  '-v': 'version',
  '--version': 'version',
};

/**
 * Parses CLI arguments into a normalized structure.
 *
 * Supports `--flag value`, `--flag=value`, short aliases and the repeatable
 * `--config key=value`. Unknown flags fail loudly rather than being ignored.
 *
 * @throws CliArgumentError for unknown flags or a missing flag value.
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: undefined,
    positionals: [],
    template: undefined,
    dir: undefined,
    config: [],
    dryRun: false,
    overwrite: false,
    json: false,
    quiet: false,
    help: false,
    version: false,
  };

  let index = 0;
  while (index < argv.length) {
    const token = argv[index];
    if (token === undefined) break;

    if (token === '--') {
      parsed.positionals.push(...argv.slice(index + 1));
      break;
    }

    if (token.startsWith('-') && token !== '-') {
      const equals = token.indexOf('=');
      const flag = equals === -1 ? token : token.slice(0, equals);
      const inlineValue = equals === -1 ? undefined : token.slice(equals + 1);

      if (flag in BOOLEAN_ALIASES) {
        if (inlineValue !== undefined) {
          throw new CliArgumentError(`Flag "${flag}" does not take a value.`);
        }
        parsed[BOOLEAN_ALIASES[flag]!] = true;
        index += 1;
        continue;
      }

      if (flag in VALUE_ALIASES) {
        const key = VALUE_ALIASES[flag]!;
        let value = inlineValue;
        if (value === undefined) {
          const next = argv[index + 1];
          if (next === undefined || (next.startsWith('-') && next !== '-')) {
            throw new CliArgumentError(`Flag "${flag}" requires a value.`);
          }
          value = next;
          index += 1;
        }
        if (key === 'config') {
          parsed.config.push(value);
        } else {
          parsed[key] = value;
        }
        index += 1;
        continue;
      }

      throw new CliArgumentError(`Unknown option "${flag}". Run "forgekit --help" for usage.`);
    }

    if (parsed.command === undefined) {
      parsed.command = token;
    } else {
      parsed.positionals.push(token);
    }
    index += 1;
  }

  return parsed;
}
