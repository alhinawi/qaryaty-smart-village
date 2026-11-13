// ─── القرى: which villages we deliver to (villages.served, admins only by RLS)
import { useEffect, useState } from 'react';
import { adminRepo } from '@/repositories';
import { DefaultDeliveryFeeCard, Empty, ErrorBox, FeeInput, Loading, Toggle } from './ui';
import { inputCls, useAction, useLoad, useDefaultDeliveryFee } from './shared';

export default function VillagesTab() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  const { data, setData, error, loading, reload } = useLoad(() => adminRepo.listVillages(q), [q]);
  const { busy, run } = useAction();
  const feeState = useDefaultDeliveryFee();

  return (
    <div>
      <DefaultDeliveryFeeCard state={feeState} />
      <input
        className={`${inputCls} mt-3`}
        type="search"
        value={search}
        placeholder="🔍 دوّر على قرية علشان تضيفها"
        onChange={(e) => setSearch(e.target.value)}
      />
      <p className="text-[12px] text-text-muted mt-2 mb-2">
        {q.trim()
          ? 'شغّل المفتاح قدّام القرية اللي بقينا نوصّلها. التغيير بيظهر للناس على طول.'
          : 'دي القرى اللي بنوصّلها أو ليها رسوم توصيل. اكتب اسم قرية فوق علشان تضيف قرية جديدة.'}{' '}
        رسوم القرية للقرى البعيدة: لو أعلى من رسوم المحل، العميل اللي ساكن فيها بيدفعها. سيبها فاضية لو مفيش.
      </p>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && data.length === 0 && <Empty>{q.trim() ? 'ملقيناش قرية بالاسم ده' : 'لسه مفيش قرى بنوصّلها'}</Empty>}
      <div className={`grid gap-2 ${loading ? 'opacity-60' : ''}`}>
        {data?.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-black/5 shadow-sm px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="m-0 font-extrabold text-[14px] truncate">{v.name}</p>
                <p className="m-0 text-[12px] text-text-muted truncate">
                  {[v.markaz, v.governorate].filter(Boolean).join('، ')}
                </p>
              </div>
              <Toggle
                label={v.served ? 'بنوصّل' : 'لأ'}
                checked={v.served}
                disabled={!!busy}
                onChange={(served) =>
                  run(
                    `v-${v.id}`,
                    async () => {
                      await adminRepo.setVillageServed(v.id, served);
                      setData((all) => (all ?? []).map((x) => (x.id === v.id ? { ...x, served } : x)));
                    },
                    served ? `بقينا نوصّل ${v.name}` : `وقّفنا التوصيل لـ ${v.name}`,
                  )
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[12px] font-bold text-text-muted">🛵 رسوم القرية:</span>
              <FeeInput
                value={v.deliveryFee}
                allowEmpty
                placeholder="مفيش"
                label={`رسوم توصيل ${v.name}`}
                onSave={async (fee) => {
                  await adminRepo.setVillageDeliveryFee(v.id, fee);
                  setData((all) => (all ?? []).map((x) => (x.id === v.id ? { ...x, deliveryFee: fee } : x)));
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
