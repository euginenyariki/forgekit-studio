import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  AUTHOR_NAME,
  SUPPORT_LINKS,
  generateProject,
  getTemplateInfo,
  installCommandFor,
  isForgeKitError,
  listTemplates,
  runCommandFor,
  type GenerateResult,
  type TemplateInfo,
} from '@forgekit/core';

import { CliArgumentError, parseArgs } from './args.js';
import { parseConfigPairs } from './config-values.js';
import type { CliIO } from './io.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string; name: string };

/** Exit codes, stable so scripts can branch on them. */
export const EXIT = {
  ok: 0,
  failure: 1,
  usage: 2,
} as const;

const COMMANDS = ['list', 'info', 'config', 'create', 'help'] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value);
}

/**
 * Runs one CLI invocation and returns its process exit code.
 *
 * All output flows through `io`, so the same code path powers the real binary
 * and the test suite.
 */
export async function run(argv: readonly string[], io: CliIO): Promise<number> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    io.err(error instanceof Error ? error.message : String(error));
    return EXIT.usage;
  }

  try {
    if (args.version) {
      io.out(packageJson.version);
      return EXIT.ok;
    }
    if (args.help || args.command === undefined || args.command === 'help') {
      io.out(helpText());
      return args.command !== undefined && !isCommand(args.command) && !args.help
        ? EXIT.usage
        : EXIT.ok;
    }
    if (!isCommand(args.command)) {
      io.err(`Unknown command "${args.command}". Run "forgekit --help" for usage.`);
      return EXIT.usage;
    }

    switch (args.command) {
      case 'list':
        return await runList(args.json, io);
      case 'info':
        return await runInfo(args.positionals[0], args.json, io);
      case 'config':
        return await runConfig(args.positionals[0], args.json, io);
      case 'create':
        return await runCreate(args, io);
      case 'help':
        io.out(helpText());
        return EXIT.ok;
    }
  } catch (error) {
    return reportError(error, args.json, io);
  }
}

async function runList(json: boolean, io: CliIO): Promise<number> {
  const templates = await listTemplates();
  if (json) {
    io.out(
      JSON.stringify(
        templates.map((template) => ({
          id: template.id,
          name: template.name,
          summary: template.summary,
          category: template.category,
          tags: template.tags,
          technologies: template.technologies,
          fileCount: template.fileCount,
          totalBytes: template.totalBytes,
          defaults: template.defaults,
          commands: template.commands,
        })),
        null,
        2,
      ),
    );
    return EXIT.ok;
  }

  const rows = templates.map((template) => [
    template.id,
    template.name,
    template.category,
    `${template.fileCount}`,
    `${formatBytes(template.totalBytes)}`,
  ]);
  io.out('Available templates:\n');
  io.out(formatTable(['ID', 'NAME', 'CATEGORY', 'FILES', 'SIZE'], rows));
  io.out('\nRun "forgekit info <template>" for details.');
  return EXIT.ok;
}

async function runInfo(templateId: string | undefined, json: boolean, io: CliIO): Promise<number> {
  if (!templateId) {
    throw new CliArgumentError('Usage: forgekit info <template>');
  }
  const template = await getTemplateInfo(templateId);
  if (json) {
    io.out(JSON.stringify(template, null, 2));
    return EXIT.ok;
  }

  io.out(`${template.name} (${template.id}) v${template.templateVersion}`);
  io.out(`${template.summary}\n`);
  io.out(template.description);
  io.out('');
  io.out(`Category:     ${template.category}`);
  io.out(`Technologies: ${template.technologies.join(', ')}`);
  io.out(`Tags:         ${template.tags.join(', ')}`);
  io.out(`Files:        ${template.fileCount} (${formatBytes(template.totalBytes)})`);
  io.out('');
  io.out('Requirements:');
  for (const requirement of template.setupRequirements) {
    io.out(`  - ${requirement}`);
  }
  io.out('');
  io.out('Commands:');
  io.out(`  dev        ${template.commands.dev}`);
  io.out(`  build      ${template.commands.build}`);
  io.out(`  typecheck  ${template.commands.typecheck}`);
  io.out('');
  io.out('Options:');
  io.out(formatTable(['KEY', 'TYPE', 'DEFAULT'], configRows(template)));
  return EXIT.ok;
}

async function runConfig(
  templateId: string | undefined,
  json: boolean,
  io: CliIO,
): Promise<number> {
  if (!templateId) {
    throw new CliArgumentError('Usage: forgekit config <template>');
  }
  const template = await getTemplateInfo(templateId);
  if (json) {
    io.out(
      JSON.stringify(
        template.configFields.map((field) => ({
          ...field,
          default: defaultFor(template, field.key),
        })),
        null,
        2,
      ),
    );
    return EXIT.ok;
  }

  io.out(`Options for "${template.id}" (all optional):\n`);
  io.out(formatTable(['KEY', 'TYPE', 'DEFAULT', 'DESCRIPTION'], fieldRows(template)));
  return EXIT.ok;
}

async function runCreate(args: ReturnType<typeof parseArgs>, io: CliIO): Promise<number> {
  const name = args.positionals[0];
  if (!name) {
    throw new CliArgumentError('Usage: forgekit create <name> --template <id> [options]');
  }
  if (!args.template) {
    throw new CliArgumentError('Missing --template. Run "forgekit list" to see the options.');
  }

  const template = await getTemplateInfo(args.template);
  const config = parseConfigPairs(args.config, template);

  const result = await generateProject(
    {
      name,
      template: args.template,
      targetDir: args.dir,
      dryRun: args.dryRun,
      overwrite: args.overwrite,
      config,
    },
    { cwd: io.cwd() },
  );

  if (args.json) {
    io.out(JSON.stringify(result, null, 2));
    return EXIT.ok;
  }

  reportGeneration(result, io);
  return EXIT.ok;
}

function reportGeneration(result: GenerateResult, io: CliIO): void {
  const location = path.isAbsolute(result.targetDir) ? result.targetDir : `./${result.targetDir}`;

  if (result.dryRun) {
    io.out(
      `Planned ${result.template} project "${result.projectName}" in ${location} (${result.fileCount} files).`,
    );
    io.out('\nFiles:');
    for (const file of result.files.slice(0, 20)) {
      io.out(`  ${file}`);
    }
    if (result.files.length > 20) {
      io.out(`  ... and ${result.files.length - 20} more`);
    }
    io.out('\nDry run: nothing was written.');
    return;
  }

  io.out(
    `Created ${result.template} project "${result.projectName}" in ${location} (${result.fileCount} files, ${formatBytes(result.bytesWritten)}).`,
  );

  const install = installCommandFor(result.config.packageManager);
  io.out('\nNext steps:');
  io.out(`  cd ${result.targetDir}`);
  io.out(`  ${install}`);
  io.out(`  ${runCommandFor(result.config.packageManager)}`);
}

function configRows(template: TemplateInfo): string[][] {
  return template.configFields.map((field) => [
    field.key,
    field.type,
    String(defaultFor(template, field.key)),
  ]);
}

function fieldRows(template: TemplateInfo): string[][] {
  return template.configFields.map((field) => [
    field.key,
    field.type,
    String(defaultFor(template, field.key)),
    field.help,
  ]);
}

/** Reads one default value out of a template's config object. */
function defaultFor(template: TemplateInfo, key: string): unknown {
  return (template.defaults as unknown as Record<string, unknown>)[key];
}

function reportError(error: unknown, json: boolean, io: CliIO): number {
  if (json) {
    const payload = isForgeKitError(error)
      ? error.toJSON()
      : { name: 'Error', message: error instanceof Error ? error.message : String(error) };
    io.err(JSON.stringify({ error: payload }, null, 2));
    return error instanceof CliArgumentError ? EXIT.usage : EXIT.failure;
  }

  if (error instanceof CliArgumentError) {
    io.err(error.message);
    return EXIT.usage;
  }
  if (isForgeKitError(error)) {
    io.err(`error [${error.code}]: ${error.message}`);
    for (const [key, value] of Object.entries(error.details ?? {})) {
      io.err(`  ${key}: ${JSON.stringify(value)}`);
    }
    return EXIT.failure;
  }
  io.err(error instanceof Error ? error.message : String(error));
  return EXIT.failure;
}

function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => (row[index] ?? '').length)),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, index) => cell.padEnd(widths[index] ?? cell.length))
      .join('  ')
      .trimEnd();
  return [line(headers), line(widths.map((width) => '-'.repeat(width))), ...rows.map(line)].join(
    '\n',
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function helpText(): string {
  const support = SUPPORT_LINKS.map((link) => `  ${link.label.padEnd(18)}${link.url}`).join('\n');
  return `ForgeKit — generate production-ready projects from versioned templates.

Usage:
  forgekit <command> [options]

Commands:
  list                     List available templates
  info <template>          Show everything known about a template
  config <template>        Show the configurable options and their defaults
  create <name>            Generate a project from a template
  help                     Show this help

Global options:
  --json                   Print machine-readable JSON
  -q, --quiet              Suppress non-essential output
  -h, --help               Show this help
  -v, --version            Show the version

create options:
  -t, --template <id>      Template to use (required)
  -d, --dir <path>         Destination directory (default: <name>)
  -c, --config <key=value> Set a template option (repeatable)
      --dry-run            Plan the project without writing files
      --overwrite          Allow writing into a non-empty directory

Examples:
  forgekit list
  forgekit create my-app --template react-vite
  forgekit create api --template express-api --config port=8080 --config packageManager=pnpm
  forgekit info fullstack --json
  forgekit create store --template fullstack --dir projects/store

ForgeKit is built by ${AUTHOR_NAME}. Support the work:
${support}`;
}
