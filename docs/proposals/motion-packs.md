# Motion pack previews - 7 November 2026

Review-only query flag ?motion=1|2|3. No flag means no extra badge, observers or overrides. No publication approval. Card geometry, themes, prices and ordering remain untouched. No added dependency.

1. Quiet and fast:160ms, opacity reveal, no translation/stagger; press0.99.
2. Green premium:260ms,8px local reveal,35ms bounded stagger; press0.98. Recommended balance: enough feedback without slowing navigation.
3. Light energy:340ms,16px local reveal/0.985scale,50ms bounded stagger; press0.97. More visible but could feel busy on long lists.

Route entrance max220ms; no remount/key reset that discards form state. IntersectionObserver reveals only viewport cards once per route, bounded3-step stagger, mutation scanner batch via requestAnimationFrame. No sticky opacity hidden states if observation fails. Animations transform/opacity only; no layout/property tween, no blur/shadow animation, no permanent will-change layer, no JS animation library. Drawer timing matches pack and stays anchored to existing left edge of RTL UI (hamburger is left). Press feedback/buttons/nav icon transition. Skeleton uses two low-opacity cycles then rests, no infinite moving shimmer. All palettes use existing colors unchanged.

Reduced motion: no CSS transition/animation, no transforms on cards/buttons/nav, route WAAPI skipped; changing preference cancels current entrance. Badge is preview-only and pointer-events:none. No whole-page fly/zoom, parallax or native View Transitions because they introduce more fallback and accessibility surface than needed here.

Source-grounded principles:
- https://web.dev/articles/animations-guide : prefer transform/opacity and avoid layout/paint-heavy property animation.
- https://carbondesignsystem.com/elements/motion/overview/ : productive versus expressive motion; use expression sparingly, microfeedback fast, simplify for mobile and less powerful devices.
- https://m3.material.io/styles/motion/overview : motion communicates hierarchy/relationships; inspected documentation, no exact duration copied as a current requirement.
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion : respect device minimize-motion preference; panning/scaling can trigger discomfort.
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html : remove non-essential interaction animation when preference requests it.
- https://developer.chrome.com/docs/web-platform/view-transitions : available navigation-transition approach, intentionally not selected for this small patch.

QA:513 application tests/build/scoped lint pass. Browser recordings390×844 with native3x screenshots, no runtime errors. Reduced-motion320 verified all3 packs have animation:none/transform:none and no overflow. No real low-end Android GPU/thermal/FPS test, so no60fps claim. Videos are actual local app recordings, not composited concept animation. Current published/sibling fixes require sequential merge before selecting a pack.

## Selected default

Main relayed user approval 2026-11-07 11:03. Pack2 selected as main communicated. This final patch enables2 without query parameters, removes preview badge and alternate packs, and preserves reduced-motion support. Based on latest fetched main f59364b; separate image/settings previews are not bundled. No database changes or direct publication.
