import { TemplateRenderError } from './errors.js';

/**
 * Documented template variables.
 *
 * Only these placeholders are replaced anywhere in a template. Patterns that
 * look different (for example a JSX inline `style={{ marginTop: 8 }}` object)
 * are intentionally left untouched: the placeholder grammar requires a single
 * identifier between the braces.
 */
export const TEMPLATE_VARIABLES = [
  'projectName',
  'packageName',
  'description',
  'packageManager',
  'installCommand',
  'runCommand',
  'port',
  'apiPort',
  'webPort',
  'corsOrigin',
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export type TemplateVariables = Partial<Record<TemplateVariable, string | number>>;

/** Matches `{{identifier}}` with optional inner whitespace. */
const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

export function isTemplateVariable(value: string): value is TemplateVariable {
  return (TEMPLATE_VARIABLES as readonly string[]).includes(value);
}

/** Returns the unique placeholder identifiers used by a document, in order of appearance. */
export function findPlaceholders(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER_PATTERN)) {
    const key = match[1];
    if (key) found.add(key);
  }
  return [...found];
}

/**
 * Replaces every documented placeholder in `content`.
 *
 * @throws TemplateRenderError when the document uses a placeholder that was not
 * provided, which catches template authoring mistakes instead of shipping
 * literal `{{...}}` text into generated projects.
 */
export function renderTemplate(
  content: string,
  variables: TemplateVariables,
  sourcePath = '<template>',
): string {
  return content.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    if (!isTemplateVariable(key)) {
      throw new TemplateRenderError(
        `Unknown template variable "{{${key}}}" in ${sourcePath}. ` +
          `Documented variables: ${TEMPLATE_VARIABLES.join(', ')}.`,
        { file: sourcePath, variable: key, known: [...TEMPLATE_VARIABLES] },
      );
    }
    const value = variables[key];
    if (value === undefined) {
      throw new TemplateRenderError(
        `Template variable "{{${key}}}" is not available for this template (${sourcePath}).`,
        { file: sourcePath, variable: key },
      );
    }
    const text = String(value);
    if (text.includes('{{')) {
      throw new TemplateRenderError(
        `Value for template variable "${key}" must not contain "{{" (${sourcePath}).`,
        { file: sourcePath, variable: key },
      );
    }
    return text;
  });
}
