import { deleteRequest, fetchJson, patchJson, postJson } from './api.ts';

export interface Item {
  id: string;
  name: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ItemResponse {
  item: Item;
}

interface ItemListResponse {
  items: Item[];
}

export async function listItems(): Promise<Item[]> {
  const payload = await fetchJson<ItemListResponse>('/api/items');
  return payload.items;
}

export async function createItem(name: string): Promise<Item> {
  const payload = await postJson<ItemResponse>('/api/items', { name });
  return payload.item;
}

export async function setItemDone(item: Item, done: boolean): Promise<Item> {
  const payload = await patchJson<ItemResponse>(`/api/items/${item.id}`, { done });
  return payload.item;
}

export async function deleteItem(id: string): Promise<void> {
  await deleteRequest(`/api/items/${id}`);
}
