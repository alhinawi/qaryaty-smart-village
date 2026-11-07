import { beforeEach, it, expect } from 'vitest';
import { demoOpinions } from './demoOpinions';
import { invalidateDemoMode, setDemoModeFlag } from '@/config/demoMode';
beforeEach(() => invalidateDemoMode());
it('unknown, OFF and failed setting hide all fictional opinions', () => {
 expect(demoOpinions('shop',1)).toEqual([]);
 setDemoModeFlag(false);expect(demoOpinions('product','1:milk')).toEqual([]);
 setDemoModeFlag(true);expect(demoOpinions('provider',1)).toHaveLength(3);
 invalidateDemoMode();expect(demoOpinions('provider',1)).toEqual([]);
});
it('deterministic target-specific samples have no real IDs or completed-order assertions', () => {
 setDemoModeFlag(true);
 const rows=demoOpinions('shop',1);
 expect(rows).toEqual(demoOpinions('shop',1));
 expect(rows).not.toEqual(demoOpinions('shop',2));
 expect(rows.every(r=>r.id.startsWith('opinion_demo_')&&r.stars>=1&&r.stars<=5)).toBe(true);
 expect(rows[0]).not.toHaveProperty('completedOrder');
});
