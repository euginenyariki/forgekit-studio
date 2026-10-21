/**
 * Template path conventions.
 *
 * Dotfiles are stored without the leading dot because npm strips some of them
 * from published tarballs, which would silently drop them from generated
 * projects installed from the registry. Both the catalog and the generator map
 * template paths through `renameTemplatePath`, so what a template lists is what
 * a generated project receives.
 */

/** Template file names that are written under a different name. */
export const TEMPLATE_FILE_RENAMES: Record<string, string> = {
  gitignore: '.gitignore',
  editorconfig: '.editorconfig',
  npmrc: '.npmrc',
  'env.example': '.env.example',
  'env.local.example': '.env.local.example',
};

/** Applies `TEMPLATE_FILE_RENAMES` to the final path segment. */
export function renameTemplatePath(relativePath: string): string {
  const segments = relativePath.split('/');
  const last = segments[segments.length - 1];
  if (last === undefined) return relativePath;
  const renamed = TEMPLATE_FILE_RENAMES[last];
  if (renamed !== undefined) {
    segments[segments.length - 1] = renamed;
  }
  return segments.join('/');
}
