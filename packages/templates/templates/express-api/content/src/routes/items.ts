import { Router } from 'express';

import { HttpError, parseBody } from '../lib/http.js';
import { createItemSchema, itemStore, updateItemSchema } from '../lib/store.js';

export const itemsRouter = Router();

itemsRouter.get('/', (_request, response) => {
  res.json({ items: itemStore.list() });
});

itemsRouter.get('/:id', (req, res) => {
  const item = itemStore.get(req.params.id);
  if (!item) {
    throw new HttpError(404, `Item "${req.params.id}" was not found`);
  }
  res.json({ item });
});

itemsRouter.post('/', (req, res) => {
  const input = parseBody(createItemSchema, req.body);
  res.status(201).json({ item: itemStore.create(input) });
});

itemsRouter.patch('/:id', (req, res) => {
  const input = parseBody(updateItemSchema, req.body);
  const item = itemStore.update(req.params.id, input);
  if (!item) {
    throw new HttpError(404, `Item ${req.params.id} was not found`);
  }
  res.json({ item });
});

itemsRouter.delete('/:id', (req, res) => {
  if (!itemStore.remove(req.params.id)) {
    throw new HttpError(404, `Item ${req.params.id} was not found`);
  }
  res.status(204).end();
});
