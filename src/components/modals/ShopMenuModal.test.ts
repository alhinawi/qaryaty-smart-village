import { describe, expect, it } from 'vitest';
import { ShopMenuModal } from './ShopMenuModal';

// Import the actual TSX module, not a source-text snapshot: malformed JSX must
// fail the test transform, even when pure pricing and repository tests pass.
describe('shop menu module', () => {
  it('imports the production menu component', () => {
    expect(ShopMenuModal).toBeTypeOf('function');
  });
});
