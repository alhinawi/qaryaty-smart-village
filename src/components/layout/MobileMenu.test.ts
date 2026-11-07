import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
describe('drawer navigation closes the overlay',()=>{
 it('every menu Link, including Settings, has the close handler',()=>{const source=fs.readFileSync(new URL('./MobileMenu.tsx',import.meta.url),'utf8');const links=source.match(/<Link\b[^>]*>/g)??[];expect(links.length).toBeGreaterThan(2);for(const link of links)expect(link).toContain('onClick={onClose}');});
});
