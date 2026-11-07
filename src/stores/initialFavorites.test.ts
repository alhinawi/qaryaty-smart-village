import { it, expect } from 'vitest';
import { useUserStore } from './useUserStore';
it('starts with no choices attributed to a new visitor and preserves user toggles', () => {
  expect(useUserStore.getState().favorites).toEqual([]);
  useUserStore.getState().toggleFavorite(1);
  expect(useUserStore.getState().isFavorite(1)).toBe(true);
  useUserStore.getState().toggleFavorite(1);
  expect(useUserStore.getState().favorites).toEqual([]);
});
