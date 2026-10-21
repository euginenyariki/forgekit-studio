/**
 * Canonical support and project links.
 *
 * Kept dependency free and Node-free so the CLI, the studio footer and any
 * template README can import the same values from `@forgekit/core/schema`.
 */

/** Home of the ForgeKit Studio source code. */
export const FORGEKIT_REPO_URL = 'https://github.com/euginenyariki';

/** Primary tip link. */
export const KOFI_URL = 'https://ko-fi.com/euginestark';

/** Secondary tip link. */
export const SODA_URL = 'https://buymesoda.com/W2nsVZsQNQXjfqwZH6FepWewxOI2';

/** Maintainer shown in generated metadata and the studio footer. */
export const AUTHOR_NAME = 'Eugine Nyariki';
export const AUTHOR_EMAIL = 'euginenyariki100@gmail.com';

/** A single support destination, ready to render as a link or a CLI line. */
export interface SupportLink {
  /** Stable identifier, e.g. `ko-fi`. */
  id: 'ko-fi' | 'soda';
  /** Human readable label, e.g. "Buy me a soda". */
  label: string;
  url: string;
}

/** Support destinations in display order. */
export const SUPPORT_LINKS: readonly SupportLink[] = [
  { id: 'ko-fi', label: 'Support on Ko-fi', url: KOFI_URL },
  { id: 'soda', label: 'Buy me a soda', url: SODA_URL },
];
