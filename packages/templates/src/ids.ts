/** Ordered list of every template id shipped by this package. */
export const TEMPLATE_IDS = ['react-vite', 'express-api', 'fullstack'] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Returns `true` when `value` is one of the template ids shipped by this package. */
export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value);
}
