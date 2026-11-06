// ─── /market/mine: my posts (sale + swap) and the messages about posts
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { marketRepo, type MarketConversation, type MarketListing } from '@/repositories';
import { KIND_INFO, canRenew, categoryIcon, ownerStatusLabel, timeAgo } from '@/config/market';
import { ROUTES, marketChatPath, marketItemPath } from '@/routes';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackBar, PhotoBox, PriceLine, useMarketUser, usePageTitle } from './shared';

export default function MarketMinePage() {
  const user = useMarketUser();
  const navigate = useNavigate();
  usePageTitle('إعلاناتي • قريتي');
  const [tab, setTab] = useState<'posts' | 'messages'>('posts');
  const [posts, setPosts] = useState<MarketListing[] | null>(null);
  const [threads, setThreads] = useState<MarketConversation[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([marketRepo.mine(), marketRepo.conversations()])
      .then(([p, t]) => {
        if (!alive) return;
        setPosts(p);
        setThreads(t);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'حصلت مشكلة'));
    return () => {
      alive = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Navigate to={ROUTES.login} state={{ from: ROUTES.marketMine }} replace />;
  const unread = (threads ?? []).reduce((n, t) => n + t.unread, 0);

  return (
    <section className="max-w-[720px] mx-auto pb-10">
      <BackBar title="إعلاناتي" />
      <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-card mb-4" role="tablist">
        {(['posts', 'messages'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-[44px] rounded-xl font-extrabold text-sm ${tab === t ? 'bg-green text-white' : 'text-green-dark'}`}
          >
            {t === 'posts' ? '📋 إعلاناتي' : '💬 الرسايل'}
            {t === 'messages' && unread > 0 && (
              <span className="mr-1.5 inline-flex min-w-5 h-5 px-1 rounded-full bg-gold text-black text-[11px] items-center justify-center">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {error ? (
        <p className="bg-white rounded-2xl p-6 text-center shadow-card">{error}</p>
      ) : posts === null || threads === null ? (
        <p className="bg-white rounded-2xl p-6 text-center shadow-card" aria-busy="true">
          بيحمّل…
        </p>
      ) : tab === 'posts' ? (
        posts.length === 0 ? (
          <EmptyState emoji="🏷️" title="لسه مانشرتش حاجة" description="اعرض حاجة للبيع أو للتبادل في دقيقة." actionText="أضف إعلان" onAction={() => navigate(`${ROUTES.marketNew}?kind=sale`)} />
        ) : (
          <ul className="flex flex-col gap-2">
            {posts.map((l) => (
              <li key={l.id}>
                <Link to={marketItemPath(l.id)} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-card">
                  <PhotoBox src={l.photos[0]} alt="" icon={categoryIcon(l.category)} className="w-16 h-16 rounded-xl shrink-0 text-[26px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-sm truncate">
                      <span aria-hidden="true">{KIND_INFO[l.kind].icon} </span>
                      {l.title}
                    </p>
                    <PriceLine listing={l} />
                    <p className={`text-[12px] font-bold ${l.status === 'hidden' ? 'text-red-600' : 'text-text-muted'}`}>
                      {ownerStatusLabel(l)}
                      {canRenew(l) && <span className="text-[#8a5a00]"> • جدّده</span>}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : threads.length === 0 ? (
        <EmptyState emoji="💬" title="مفيش رسايل" description="أي حد يسأل عن إعلاناتك، أو إنت تسأل عن إعلان حد، الرسايل هتظهر هنا." />
      ) : (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => (
            <li key={`${t.listingId}-${t.buyerId}`}>
              <Link to={marketChatPath(t.listingId, t.buyerId)} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-card">
                <PhotoBox src={t.listingPhoto ?? undefined} alt="" icon={KIND_INFO[t.listingKind].icon} className="w-14 h-14 rounded-xl shrink-0 text-[24px]" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm truncate">
                    {t.otherName || (t.iAmOwner ? 'مشتري' : 'صاحب الإعلان')} • <span className="text-text-muted font-bold">{t.listingTitle}</span>
                  </p>
                  <p className={`text-[13px] truncate ${t.unread ? 'font-extrabold text-text' : 'text-text-muted'}`}>
                    {t.lastFromMe ? 'إنت: ' : ''}
                    {t.lastBody}
                  </p>
                  <p className="text-[11px] text-text-muted">{timeAgo(t.lastAt)}</p>
                </div>
                {t.unread > 0 && (
                  <span className="shrink-0 min-w-6 h-6 px-1.5 rounded-full bg-green text-white text-[12px] font-black flex items-center justify-center">{t.unread}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
