import { useSyncExternalStore } from 'react';
import { appearanceGate, subscribeAppearanceGate } from '@/config/appearanceGate';
export function useAppearanceEnabled() { return useSyncExternalStore(subscribeAppearanceGate, appearanceGate, () => null); }
