import { useState } from 'react';
import { useTrackingDemoMode } from '@/hooks/useTrackingDemoMode';
import { demoOpinions, type OpinionKind } from './demoOpinions';

export function DemoOpinions({ kind, target, compact = false }: { kind: OpinionKind; target: string | number; compact?: boolean }) {
 const demo = useTrackingDemoMode();
 const [expanded, setExpanded] = useState(!compact);
 if (!demo) return null;
 const rows = demoOpinions(kind, target);
 if (!rows.length) return null;
 return <section aria-label="آراء العملاء" className={compact ? 'mt-2' : 'mt-5 rounded-2xl border border-green/15 bg-white p-4'}>
  {compact ? <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="min-h-11 text-xs text-green font-bold">{expanded ? 'إخفاء الآراء' : 'آراء العملاء'}</button> : <h2 className="text-lg font-extrabold text-green-dark mb-2">آراء العملاء</h2>}
  {expanded && <div className="divide-y divide-green/10">{rows.map(row => <article key={row.id} className="py-3">
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{row.author}</h3><span className="text-amber-800 text-sm" aria-label={`${row.stars} من 5 نجوم`}>{'★'.repeat(row.stars)}</span></div>
   <p className="text-sm leading-7 mt-1 break-words">{row.text}</p>
  </article>)}</div>}
 </section>;
}
