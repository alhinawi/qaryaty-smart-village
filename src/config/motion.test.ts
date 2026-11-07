import { it, expect } from 'vitest';
import { MOTION } from './motion';
it('keeps approved lightweight motion values',()=>{expect(MOTION).toEqual({duration:260,distance:8,stagger:35,press:0.98});});
