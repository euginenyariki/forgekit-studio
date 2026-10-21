import { randomUUID } from 'node:crypto';

import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80, 'name must be 80 characters or fewer'),
  done: z.boolean().default(false),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export interface Item extends CreateItemInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * In-memory repository.
 *
 * Swap this class for a database client when you need persistence; the route
 * handlers only depend on this small surface.
 */
export class ItemStore {
  readonly #items = new Map<string, Item>();

  list(): Item[] {
    return [...this.#items.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Item | undefined {
    return this.#items.get(id);
  }

  create(input: CreateItemInput): Item {
    const timestamp = new Date().toISOString();
    const item: Item = {
      ...input,
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.#items.set(item.id, item);
    return item;
  }

  update(id: string, input: UpdateItemInput): Item | undefined {
    const existing = this.#items.get(id);
    if (!existing) return undefined;
    const updated: Item = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.#items.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.#items.delete(id);
  }
}

export const itemStore = new ItemStore();
