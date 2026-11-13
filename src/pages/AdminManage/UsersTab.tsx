// ─── المستخدمين: search and block/unblock (server functions check the caller).
// Supervisors are appointed by the owner from the staff panel at /admin.
import { useMemo, useState } from 'react';
import { authRepo } from '@/repositories';
import { useAuthStore } from '@/stores/useAuthStore';
import { normalizeArabic } from '@/repositories/villages/types';
import type { AuthUser } from '@/types';
import { STAFF_ROLE_LABELS, isStaffRole } from '@/config/staffTiers';
import { userMatches } from '@/repositories/admin/logic';
import { Empty, ErrorBox, Loading } from './ui';
import { formatDateTime, inputCls, smallBtn, useAction, useLoad } from './shared';

type Filter = 'all' | 'staff' | 'blocked';

export default function UsersTab() {
  const me = useAuthStore((s) => s.session?.user.id);
  const { data, setData, error, loading, reload } = useLoad(() => authRepo.listUsers(), []);
  const { busy, run } = useAction();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          userMatches(u, query, normalizeArabic) &&
          (filter === 'all' || (filter === 'staff' ? isStaffRole(u.role) : u.blocked)),
      ),
    [data, query, filter],
  );

  const replace = (u: AuthUser) => setData((all) => (all ?? []).map((x) => (x.id === u.id ? u : x)));

  return (
    <div>
      <div className="grid gap-2 mt-3">
        <input
          className={inputCls}
          type="search"
          value={query}
          placeholder="🔍 الاسم، اسم المستخدم، الموبايل، القرية"
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2">
          {(
            [
              ['all', 'الكل'],
              ['staff', 'المشرفين'],
              ['blocked', 'المحظورين'],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`${smallBtn} ${filter === id ? '!bg-green !text-white' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[13px] text-text-muted mt-3 mb-2">
        {data ? `${list.length.toLocaleString('ar-EG')} من ${data.length.toLocaleString('ar-EG')} مستخدم` : ''}
      </p>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && list.length === 0 && <Empty>مفيش حد بالبحث ده</Empty>}

      <div className={`grid gap-2 ${loading ? 'opacity-60' : ''}`}>
        {list.map((u) => {
          const isMe = u.id === me;
          return (
            <div key={u.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="m-0 font-extrabold text-[14px] truncate">
                    {u.name || 'بدون اسم'} {isMe && <span className="text-text-muted font-bold">(إنت)</span>}
                  </p>
                  <p className="m-0 text-[12px] text-text-muted truncate">
                    {u.username ? `@${u.username}` : 'لسه ماكمّلش بياناته'} {u.village && `· ${u.village}`}
                  </p>
                  <p className="m-0 text-[12px] text-text-muted">اتسجّل {formatDateTime(u.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isStaffRole(u.role) && (
                    <span className="px-2 py-0.5 rounded-full bg-green/10 text-green-dark text-[12px] font-extrabold">
                      {STAFF_ROLE_LABELS[u.role]}
                    </span>
                  )}
                  {u.blocked && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[12px] font-extrabold">
                      محظور
                    </span>
                  )}
                </div>
              </div>
              {u.phone && (
                <a
                  href={`tel:${u.phone}`}
                  dir="ltr"
                  className="inline-block mt-1 text-[13px] text-green-dark font-bold no-underline"
                >
                  {u.phone}
                </a>
              )}
              {!isMe && u.role !== 'owner' && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className={`${smallBtn} ${u.blocked ? '' : '!text-red-700 !border-red-200'}`}
                    disabled={!!busy}
                    onClick={() =>
                      run(
                        `block-${u.id}`,
                        async () => replace(await authRepo.setBlocked(u.id, !u.blocked)),
                        u.blocked ? `اتشال الحظر عن ${u.name}` : `${u.name} اتحظر`,
                      )
                    }
                  >
                    {busy === `block-${u.id}` ? 'لحظة…' : u.blocked ? 'شيل الحظر' : 'احظره'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
