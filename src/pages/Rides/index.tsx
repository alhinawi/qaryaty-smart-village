// ─── شير مواصلة: every live shared trip, with filters
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { Link } from 'react-router';
import { ROUTES } from '@/routes';
import { rideRepo } from '@/repositories';
import {
  EMPTY_RIDE_FILTERS,
  RIDE_KINDS,
  TIME_WINDOWS,
  filterRides,
  rideVillages,
  type RideFilters,
} from '@/config/rides';
import { shortVillage } from '@/config/jobs';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import type { Ride } from '@/repositories/rides/types';
import { outlineBtn, primaryBtn, useSignInFirst } from '@/pages/Jobs/jobUi';
import { RideCard, RideSafetyNote } from './parts';
import { counted } from '@/utils/plural';

const chip = (on: boolean) =>
  `inline-flex items-center gap-1 min-h-[40px] px-3.5 rounded-full border-2 text-[13px] font-extrabold cursor-pointer whitespace-nowrap font-[Cairo,sans-serif] ${
    on ? 'border-green bg-green text-white' : 'border-[#e5e7eb] bg-white text-text'
  }`;

export default function RidesPage() {
  const user = useAuthStore(selectUser);
  const signInFirst = useSignInFirst();
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [f, setF] = useState<RideFilters>(EMPTY_RIDE_FILTERS);

  useEffect(() => {
    document.title = 'شير مواصلة | قريتي';
    let alive = true;
    rideRepo
      .listPublic()
      .then((list) => alive && setRides(list))
      .catch(() => alive && setRides([]));
    return () => {
      alive = false;
    };
  }, []);

  const villages = useMemo(() => rideVillages(rides ?? []), [rides]);
  const shown = useMemo(() => filterRides(rides ?? [], f), [rides, f]);
  const set = <K extends keyof RideFilters>(key: K, value: RideFilters[K]) => setF((cur) => ({ ...cur, [key]: value }));

  const post = (
    <Link
      to={ROUTES.ridesNew}
      className={`${primaryBtn} w-full sm:w-auto`}
      onClick={(e) => {
        if (!user) {
          e.preventDefault();
          signInFirst(ROUTES.ridesNew);
        }
      }}
    >
      <Plus size={17} className="shrink-0" aria-hidden="true" /> نزّل مشوارك
    </Link>
  );

  return (
    <div className="max-w-[760px] mx-auto px-4 py-5" dir="rtl">
      <header className="mb-3">
        <h1 className="text-[clamp(1.35rem,4.5vw,1.75rem)] font-black text-green-dark m-0">🚗 شير مواصلة</h1>
        <p className="text-[14px] text-text-muted m-0 mt-1 leading-relaxed">
          بتطلع كل يوم في نفس الميعاد؟ اقسم التاكسي مع ناس من قريتك، أو لو عندك عربية شيّر الكراسي الفاضية بسعر رمزي.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {RIDE_KINDS.map((k) => (
          <Link
            key={k.id}
            to={`${ROUTES.ridesNew}?kind=${k.id}`}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                signInFirst(`${ROUTES.ridesNew}?kind=${k.id}`);
              }
            }}
            className="flex flex-col gap-0.5 bg-white rounded-2xl p-3 shadow-sm border-2 border-transparent hover:border-green no-underline text-text"
          >
            <span className="text-2xl" aria-hidden="true">
              {k.icon}
            </span>
            <span className="font-extrabold text-[14px] text-green-dark">{k.label}</span>
            <span className="text-[12px] text-text-muted leading-snug">{k.hint}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {post}
        {user && (
          <Link to={ROUTES.ridesMine} className={`${outlineBtn} w-full sm:w-auto`}>
            📋 مشاويري وطلباتي
          </Link>
        )}
      </div>

      <section className="bg-white rounded-2xl p-3 shadow-sm mb-3" aria-label="دوّر على مشوار">
        <label htmlFor="ride-search" className="sr-only">
          رايح فين؟
        </label>
        <input
          id="ride-search"
          type="search"
          value={f.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="🔍 رايح فين؟ مثلًا: المنصورة، الجامعة"
          className="w-full min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-3 text-[14px] font-[Cairo,sans-serif] focus:border-green outline-none"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select
            aria-label="طالع من"
            value={f.village}
            onChange={(e) => set('village', e.target.value)}
            className="min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-2 text-[13px] font-bold bg-white font-[Cairo,sans-serif]"
          >
            <option value="">📍 من أي قرية</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {shortVillage(v)}
              </option>
            ))}
          </select>
          <select
            aria-label="ميعاد الطلوع"
            value={f.window}
            onChange={(e) => set('window', e.target.value)}
            className="min-h-[44px] rounded-xl border-2 border-[#e5e7eb] px-2 text-[13px] font-bold bg-white font-[Cairo,sans-serif]"
          >
            <option value="">🕒 أي ميعاد</option>
            {TIME_WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1" role="group" aria-label="نوع المشوار">
          <button type="button" className={chip(f.kind === '')} aria-pressed={f.kind === ''} onClick={() => set('kind', '')}>
            الكل
          </button>
          {RIDE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={chip(f.kind === k.id)}
              aria-pressed={f.kind === k.id}
              onClick={() => set('kind', f.kind === k.id ? '' : k.id)}
            >
              <span aria-hidden="true">{k.icon}</span> {k.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
          <button type="button" className={chip(f.womenOnly)} aria-pressed={f.womenOnly} onClick={() => set('womenOnly', !f.womenOnly)}>
            🧕 ستات بس
          </button>
          <button type="button" className={chip(f.today)} aria-pressed={f.today} onClick={() => set('today', !f.today)}>
            📅 طالعين النهارده
          </button>

        </div>
      </section>

      <div className="mb-3">
        <RideSafetyNote compact />
      </div>

      {rides === null ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[112px] bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-2" aria-hidden="true">
            🚐
          </div>
          <p className="font-extrabold m-0">{rides.length === 0 ? 'لسه مفيش مشاوير' : 'مفيش مشاوير بالفلاتر دي'}</p>
          <p className="text-[13px] text-text-muted mt-1 mb-4">
            {rides.length === 0 ? 'كون أول واحد ينزّل مشواره، والناس اللي طالعة في نفس الميعاد هتكلمك.' : 'جرّب تشيل فلتر، أو نزّل مشوارك والناس هتلاقيك.'}
          </p>
          {post}
        </div>
      ) : (
        <>
          <p className="text-[12px] text-text-muted m-0 mb-2">{shown.length === 1 ? 'مشوار واحد' : shown.length === 2 ? 'مشوارين' : `${shown.length} ${counted(shown.length, 'مشوار', 'مشوارين', 'مشاوير')}`}</p>
          <ul className="flex flex-col gap-3 p-0 m-0 list-none">
            {shown.map((ride) => (
              <li key={ride.id}>
                <RideCard ride={ride} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
