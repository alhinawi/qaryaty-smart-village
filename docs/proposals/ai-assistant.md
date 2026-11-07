# مساعد قريتي: secure path from demo replies to live AI

Status: CODE READY 2026-11-08, nothing deployed. The edge function
(`supabase/functions/assistant-reply/`), the app-side live path
(`src/services/assistant/assistantLive.ts`, fallback-tested), and the quota
table migration (`supabase/migrations/20261108050000_assistant_usage.sql`)
are prepared. The app still ships the demo engine only until the owner OKs
the deploy (function + secrets), then it prefers live answers. This doc is the plan for
turning on real answers without ever putting a provider key in the app.

## Rule number one: the key never ships

A Vite build is public — anything in `VITE_*` env or in the bundle is readable
by every visitor. The Groq/Gemini keys must live server-side only. The app
calls OUR endpoint; our endpoint calls the provider.

## Proposed shape

1. **Supabase Edge Function `assistant-reply`** (fits the existing backend;
   the key goes in with `supabase secrets set GROQ_API_KEY=...`,
   `GEMINI_API_KEY=...` — never in SQL, never in the repo).
   - Input: `{ messages: [{from, text}], audience: 'customer' | 'merchant' }`.
   - Server builds the system prompt (Egyptian Arabic, role-aware, Qaryati
     facts only) and calls Groq first (fast, cheap); on Groq failure or rate
     limit, falls back to Gemini; on total failure returns a flag so the app
     uses the local demo engine.
   - Rate limiting per session/IP so a guest can't burn the quota.
   - No conversation logging with identity; messages are forwarded and
     dropped. If we ever store history, it gets its own migration + owner OK.
2. **App side**: `assistantLive.ask()` calls the function via the existing
   Supabase client (`supabase.functions.invoke`). `AssistantPage` tries live
   first, falls back to `demoReply` on any failure — the screen works
   offline/demo exactly as today.

## Why not a Vercel function

Also viable (the site is on Vercel), but the project already pays for and
knows Supabase, secrets live in one place, and RLS/roles are already there.
One backend, one secrets store.

## Rollout gates

1. Owner OK on this doc.
2. Create the edge function (code in `supabase/functions/assistant-reply/`),
   set secrets from the owner's own Groq/Gemini accounts (cost is his).
3. Test with the owner's key on staging values only; verify fallback path by
   disabling the key once.
4. Ship the app change that prefers live answers.

## Rollback

Unset the secrets or delete the function; the app silently returns to demo
replies. No data migration involved.
