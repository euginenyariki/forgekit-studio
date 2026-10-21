#!/usr/bin/env node
import { run } from './cli.js';
import { processIO } from './io.js';

const exitCode = await run(process.argv.slice(2), processIO);
process.exitCode = exitCode;
