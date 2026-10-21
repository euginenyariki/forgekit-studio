import { describe, expect, it } from 'vitest';

import { getCatalog, getTemplateOrNull } from '@/lib/catalog';

describe('catalog', () => {
  it('lists every shipped template with files and config fields', async () => {
    const catalog = await getCatalog();
    expect(catalog.length).toBeGreaterThan(0);
    for (const template of catalog) {
      expect(template.id).toBeTruthy();
      expect(template.fileCount).toBeGreaterThan(0);
      expect(template.configFields.length).toBeGreaterThan(0);
      expect(Array.isArray(template.files)).toBe(true);
    }
  });

  it('returns null for unknown templates instead of throwing', async () => {
    await expect(getTemplateOrNull('does-not-exist')).resolves.toBeNull();
  });

  it('resolves a known template', async () => {
    const info = await getTemplateOrNull('react-vite');
    expect(info?.id).toBe('react-vite');
  });
});
