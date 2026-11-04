// ─── The user's village and the "nearby" toggle, in one place
import { useCallback, useMemo } from 'react';
import { DEFAULT_VILLAGE, knownVillage, villageLabel } from '@/data/villages';
import { useUserStore } from '@/stores/useUserStore';
import { useVillageStore } from '@/stores/useVillageStore';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import type { Reach } from '@/utils/reach';

export function useReach() {
  const profileVillage = useUserStore((s) => s.profile.village);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const user = useAuthStore(selectUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { includeNearby, chosen, setIncludeNearby, markChosen } = useVillageStore();

  const village = knownVillage(profileVillage) ?? DEFAULT_VILLAGE;
  const reach: Reach = useMemo(() => ({ village, includeNearby }), [village, includeNearby]);

  const setVillage = useCallback(
    (next: string) => {
      const label = villageLabel(next);
      updateProfile({ village: label });
      if (user) void updateUser({ village: label }).catch(() => undefined);
      markChosen();
    },
    [updateProfile, updateUser, user, markChosen]
  );

  return { reach, village, includeNearby, chosen, setVillage, setIncludeNearby };
}
