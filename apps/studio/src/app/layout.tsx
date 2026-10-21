import type { Metadata } from 'next';
import Link from 'next/link';

import { AUTHOR_NAME, FORGEKIT_REPO_URL, SUPPORT_LINKS } from '@forgekit/core/schema';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ForgeKit Studio',
    template: '%s · ForgeKit Studio',
  },
  description:
    'Browse ForgeKit templates, configure a project, preview every generated file and download it as a zip.',
  applicationName: 'ForgeKit Studio',
  authors: [{ name: AUTHOR_NAME }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Forge<span>Kit</span> <small>Studio</small>
          </Link>
          <nav>
            <Link href="/">Templates</Link>
            <a href={FORGEKIT_REPO_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="inner">
            <p>
              Built by {AUTHOR_NAME}. ForgeKit scaffolds projects from templates, safely and
              reproducibly.
            </p>
            <div className="support-links">
              {SUPPORT_LINKS.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
