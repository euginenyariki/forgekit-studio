'use client';

import { useState } from 'react';

const COMMANDS = [
  { label: 'List templates', cmd: 'npx @forgekit/cli list' },
  {
    label: 'Create React + Vite app',
    cmd: 'npx @forgekit/cli create my-app --template react-vite',
  },
  { label: 'Create Express API', cmd: 'npx @forgekit/cli create my-api --template express-api' },
  {
    label: 'Create full-stack app',
    cmd: 'npx @forgekit/cli create my-app --template fullstack',
  },
];

export function CliCopyBox() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(cmd);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="cli-section" aria-label="Use from CLI">
      <div className="cli-header">
        <div>
          <h2>Use from the CLI</h2>
          <p>Skip the browser — generate the same projects straight from your terminal.</p>
        </div>
      </div>
      <div className="cli-grid">
        {COMMANDS.map((item) => (
          <button
            key={item.cmd}
            type="button"
            className="cli-item"
            onClick={() => copy(item.cmd)}
            title="Click to copy"
          >
            <span className="cli-label">{item.label}</span>
            <code className="cli-cmd">{item.cmd}</code>
            <span className="cli-copy">{copied === item.cmd ? 'Copied!' : 'Copy'}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
