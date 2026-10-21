import { getTemplateInfo, listTemplates } from '@forgekit/core';
import type { TemplateInfo } from '@forgekit/core/schema';

export type { TemplateInfo };

/** Returns every available template in catalog order. */
export async function getCatalog(): Promise<TemplateInfo[]> {
  return listTemplates();
}

/** Looks up a single template, returning `null` when the id is unknown. */
export async function getTemplateOrNull(templateId: string): Promise<TemplateInfo | null> {
  try {
    return await getTemplateInfo(templateId);
  } catch {
    return null;
  }
}
