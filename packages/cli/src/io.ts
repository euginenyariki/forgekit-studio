/**
 * Output and environment abstraction for the CLI.
 *
 * Commands never touch `process` directly; they write through an `CliIO`. That
 * keeps the whole command surface unit testable: tests pass a recording IO and
 * assert on the exact text and exit code.
 */
export interface CliIO {
  /** Writes a line to standard output. */
  out(text: string): void;
  /** Writes a line to standard error. */
  err(text: string): void;
  /** Base directory relative `--dir` values resolve against. */
  cwd(): string;
}

/** The process-backed IO used by the real `forgekit` binary. */
export const processIO: CliIO = {
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
  cwd: () => process.cwd(),
};

/** An IO that records everything written to it, for tests. */
export function recordingIO(
  cwd = process.cwd(),
): CliIO & { outLines: string[]; errLines: string[] } {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    outLines,
    errLines,
    out: (text) => outLines.push(text),
    err: (text) => errLines.push(text),
    cwd: () => cwd,
  };
}
