# Lerni — Development Task Tracker

**Stack**: Next.js 15 · Supabase · Tailwind CSS · TypeScript  
**Goal**: Working, secure web MVP in 10 weeks (~20 hrs/week)  
**Branch strategy**: `feature/*` → `dev` (preview) → `main` (production)

---

## Legend
- ✅ Done
- 🔄 In progress
- ⬜ Not started
- 🔴 Non-negotiable (security / legal — cannot skip)

---

## Phase 0 — Project Setup
| Status | Task |
|--------|------|
| ✅ | Next.js 15 project scaffolded with Tailwind CSS v4 |
| ✅ | TypeScript strict mode configured |
| ✅ | ESLint configured |
| ✅ | GitHub repo created with `main` + `dev` branches |
| ✅ | Branch protection on `main` (PRs required) |
| ✅ | GitHub Actions CI (typecheck + lint + build on push/PR) |
| ✅ | Supabase project created |
| ✅ | `.env.local` with Supabase keys (not committed) |
| ✅ | `src/lib/supabase/client.ts` — browser client |
| ✅ | `src/lib/supabase/server.ts` — SSR server client |
| ✅ | `src/lib/supabase/admin.ts` — service role client (server-only) |
| ✅ | Supabase CLI linked to project |
| ✅ | Database schema migrated (`20260628000000_initial_schema.sql`) |
| ✅ | `npm run migrate` script added to package.json |
| ⬜ | Vercel project created and linked to GitHub repo |
| ⬜ | Env vars added to Vercel dashboard (URL, publishable key, service role key) |
| ⬜ | Custom domain configured on Vercel |

---

## Week 1–2 — Auth + Child Profile 🔴
| Status | Task |
|--------|------|
| ✅ | `proxy.ts` — protect `/parent/*` and `/child/*` routes (Next.js 16 convention) |
| ✅ | `/signup` page — email + password form |
| ✅ | `/login` page — email + password form with error handling |
| ✅ | `/check-email` page — post-signup verification notice |
| ✅ | `/auth/callback` route — exchange email verification code for session |
| ✅ | 🔴 `/consent` page — COPPA parental consent screen before any child data |
| ✅ | 🔴 `recordParentalConsent()` — insert into `consent_records` table (`src/lib/auth/consent.ts`) |
| ✅ | Family record created after consent (`families` insert) |
| ✅ | `/onboarding` page — add first child (name, year level, interests) |
| ✅ | Auth redirect logic (signed out → `/login`, signed in → `/dashboard`) |
| ✅ | `validateChildAccess()` utility — verify child belongs to authed family |
| ✅ | TopNav logout button |
| ⬜ | Deployed to Vercel with custom domain |

---

## Week 3–4 — Upload + AI Pipeline
| Status | Task |
|--------|------|
| ✅ | `/upload` page — drag-and-drop UI with child/subject/year selectors |
| ✅ | File validation (PDF/PPTX/DOC/DOCX, max 20MB) client + server-side |
| ✅ | Upload file to Supabase Storage (`documents/{family_id}/{child_id}/`) |
| ✅ | Insert `source_documents` record with status `processing` |
| ✅ | `lib/parsers/pdf.ts` — PDF text extraction (pdf-parse) |
| ✅ | `lib/parsers/pptx.ts` — Office text extraction (officeparser) |
| ✅ | `lib/ai/prompts.ts` — versioned prompts v1.0.0 (extractConcepts, generateActivities, validateActivity) |
| ✅ | `lib/ai/pipeline.ts` — full pipeline: extract → topic/concepts → generate → validate → save |
| ✅ | `lib/ai/safety.ts` — content safety check on AI output before storing |
| ✅ | `POST /api/documents/process` — full pipeline endpoint |
| ✅ | `GET /api/documents/[id]/status` — poll processing status |
| ✅ | Upload page polls every 3s until `ready` or `failed` |
| ✅ | `src/types/index.ts` — shared TypeScript types for activities, pipeline, API |
| ✅ | `/admin/review` page — 🔴 review/approve/reject flagged activities |
| ✅ | `PATCH /api/admin/activities/[id]/review` — approve or reject action |

---

## Week 5–6 — Child Session Core Loop
| Status | Task |
|--------|------|
| ✅ | Child home screen — real topics + concepts from DB, Play button per topic |
| ✅ | `POST /api/sessions` — create session, verify child ownership |
| ✅ | `GET /api/sessions/[id]/next` — serves only `review_status=approved` activities, tracks attempted |
| ✅ | `MultipleChoice` renderer — all states: idle, selected, correct, incorrect |
| ✅ | `FillBlank` renderer — text input with variant matching |
| ✅ | `Flashcard` renderer — flip animation + self-scoring |
| ✅ | Hint system — gentle after 1st wrong, worked explanation after 2nd wrong |
| ✅ | `POST /api/sessions/[id]/attempt` — records attempt, calculates points |
| ✅ | `POST /api/sessions/[id]/complete` — closes session, updates XP + streak |
| ✅ | Session complete screen — XP, accuracy, streak display |
| ✅ | `/child/session/[id]` — live session with real activity cycling |

---

## Week 7 — More Activity Types
| Status | Task |
|--------|------|
| ⬜ | `FillBlank` activity renderer |
| ⬜ | `DragDrop` activity renderer (mouse, desktop first) |
| ⬜ | `Flashcard` activity renderer |
| ⬜ | Activity type rotation in session |

---

## Week 8 — Progress + Gamification
| Status | Task |
|--------|------|
| ⬜ | Mastery level calculation per concept (updated after each session) |
| ⬜ | Streak counter (consecutive days with a session) |
| ⬜ | XP accumulation and display |
| ⬜ | Adaptive activity selection — prioritise weak concepts |
| ⬜ | Parent dashboard: concept mastery view |
| ⬜ | Parent dashboard: recent session history |
| ⬜ | `GET /api/children/[id]/dashboard` — weekly summary |

---

## Week 9 — Polish
| Status | Task |
|--------|------|
| ⬜ | Error states on every page (upload fails, AI fails, network error) |
| ⬜ | Loading skeleton screens (not spinners) |
| ⬜ | Mobile-responsive layout (web responsive) |
| ⬜ | Privacy policy page |
| ⬜ | Terms of service page |
| ⬜ | Onboarding flow for new parents (guided first upload) |
| ⬜ | Parent can flag incorrect activity (`PATCH /api/activities/[id]/flag`) |

---

## Week 10 — Launch Prep
| Status | Task |
|--------|------|
| ⬜ | Stripe integration — Free tier + $12/month Pro |
| ⬜ | Rate limiting on AI routes (Upstash — 5 uploads/hour/IP) |
| ⬜ | Sentry error tracking (`@sentry/nextjs`) |
| ⬜ | Vercel Analytics enabled |
| ⬜ | Manual end-to-end test (full user journey × 3 different documents) |
| ⬜ | RLS data isolation test (Family A cannot see Family B's data) |
| ⬜ | Soft launch — share with 10–20 families |

---

## Security Checklist 🔴
Non-negotiables — verify before any real users touch the app.

- ⬜ RLS enabled on all 12 tables (verified via Supabase dashboard)
- ⬜ COPPA consent recorded before any child profile created
- ⬜ `needs_review=true` activities never served to children
- ⬜ No PII in logs (UUIDs only — no child names or emails)
- ⬜ `SUPABASE_SERVICE_ROLE_KEY` never exposed client-side
- ⬜ File upload validated (type + 20MB max) before AI pipeline
- ⬜ All API routes validate authenticated user owns the resource
- ⬜ Rate limiting on `/api/documents/process`
- ⬜ Content safety check on all AI output before storing

---

## Post-MVP Backlog (Phase 2)
Not in scope for launch — add based on feedback from first families.

- ⬜ Email notifications (streak at risk, topic ready) — Resend
- ⬜ Avatar customisation
- ⬜ Teacher upload link (shareable URL)
- ⬜ Spaced repetition algorithm (SM-2, columns already in schema)
- ⬜ Speed challenge mode
- ⬜ Weekly email digest
- ⬜ Mobile app (React Native / Expo)
- ⬜ Touch support for DragDrop
- ⬜ More activity types (order/sort, image-based tap)
- ⬜ Teacher portal with class view
- ⬜ School licensing + SSO
