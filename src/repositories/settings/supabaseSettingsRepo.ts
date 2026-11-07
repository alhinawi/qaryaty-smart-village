// ─── app_settings on Supabase (demo_mode lives there, 1/0)
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import type { SettingsRepo } from './types';

const KEY = 'demo_mode';

export function createSupabaseSettingsRepo(getClient: () => Promise<SupabaseClient>): SettingsRepo {
  return {
    async getDemoMode() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', KEY).maybeSingle();
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب إعدادات الموقع', { cause: error });
      // No row yet: the site starts in demo mode
      return data === null || Number(data.value) === 1;
    },
    async setDemoMode(on) {
      const supabase = await getClient();
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: KEY, value: on ? 1 : 0, updated_at: new Date().toISOString() });
      if (error) throw new RepoError('rejected', 'ماقدرناش نحفظ الإعداد — محتاج صلاحية إدارة', { cause: error });
    },
  };
}
