import { it, expect } from 'vitest';
import { imagesForService } from './serviceImages';
import { existsSync, statSync } from 'node:fs';
it('starts school gallery with selected image3 and keeps all three optimized originals', () => {
 const images=imagesForService({id:4});
 expect(images.map(x=>x.match(/(\d)\.webp$/)?.[1])).toEqual(['3','1','2']);
 for(const image of images){expect(existsSync(`public${image}`)).toBe(true);expect(statSync(`public${image}`).size).toBeLessThan(55000);}
});
it('single images stay single, unknown stays empty, supplied gallery is bounded/deduplicated',()=>{
 expect(imagesForService({id:42})).toEqual(['/img/services/gas.webp']);
 expect(imagesForService({id:999})).toEqual([]);
 expect(imagesForService({id:4,images:['a','a','b','c','d']})).toEqual(['a','b','c']);
});
