import { describe, expect, it } from 'vitest';
import { ShopMenuPage } from './ShopMenuPage';
import { LineControl } from './LineControl';

// Import the actual TSX modules, not a source-text snapshot: malformed JSX must
// fail the test transform, even when pure pricing and repository tests pass.
describe('shop menu page module', () => {
  it('imports the production page and add control', () => {
    expect(ShopMenuPage).toBeTypeOf('function');
    expect(LineControl).toBeTypeOf('function');
  });
});
