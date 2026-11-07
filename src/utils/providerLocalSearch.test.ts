import { it, expect } from 'vitest';
import { matchesProviderSearch, filterProviders } from './peopleSections';
import { PROVIDERS } from '@/data/providers';
import { SERVICES } from '@/data/services';
it('matches names with Arabic hamza/diacritic normalization and matches specialties', () => {
 const p={...PROVIDERS[0],name:'أحمد مُحمّد',specialty:'باطنة',role:'دكتور باطنة'};
 expect(matchesProviderSearch(p,'احمد محمد')).toBe(true);
 expect(matchesProviderSearch(p,'باطنه')).toBe(true);
 expect(matchesProviderSearch(p,'مش موجود خالص')).toBe(false);
 expect(matchesProviderSearch(p,' ')).toBe(true);
});
it('local query narrows the filtered list rather than escaping teacher filters', () => {
 const filtered=filterProviders(PROVIDERS,SERVICES,{kinds:['teacher'],subject:'math'});
 const results=filtered.filter(p=>matchesProviderSearch(p,'رياضيات'));
 expect(results.length).toBeGreaterThan(0);
 expect(results.every(p=>p.kind==='teacher'&&p.subject==='math')).toBe(true);
});
