-- =============================================================================
-- Lerni — Initial Schema
-- Migration: 20260628000000_initial_schema
--
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run: all statements use IF NOT EXISTS where applicable.
--
-- Architecture decisions recorded here:
--   • soft-deletes on families + children (GDPR right-to-erasure within 30 days)
--   • child_response stored on attempts (enables parent drill-down; disclose in privacy policy)
--   • activity_flags is a table not a field (audit trail + duplicate-flag detection)
--   • spaced repetition columns added now on concepts (Phase 2 ready, zero migration cost)
--   • review_status drives activity serving; needs_review is the AI's confidence signal
--   • storage path structure: documents/{family_id}/{child_id}/{filename}
-- =============================================================================


-- =============================================================================
-- 1. FAMILIES & CHILDREN
-- =============================================================================

create table if not exists families (
  id                  uuid primary key default gen_random_uuid(),
  -- links to Supabase Auth — one auth user = one family account
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan_tier           text not null default 'free'
                        check (plan_tier in ('free', 'pro', 'school')),
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  -- soft-delete: set deleted_at to honour data deletion requests (GDPR, APPs)
  -- hard-delete via cron job 30 days after deleted_at is set
  deleted_at          timestamptz,
  unique (user_id)
);

create table if not exists children (
  id                uuid primary key default gen_random_uuid(),
  family_id         uuid not null references families(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 100),
  year_level        smallint not null check (year_level between 1 and 12),
  -- avatar_config: { base: string, hair: string, accessories: string[], world_theme: string }
  avatar_config     jsonb not null default '{}',
  -- interests used to theme story mode (Phase 2)
  interests         text[] not null default '{}',
  xp                integer not null default 0 check (xp >= 0),
  current_streak    integer not null default 0 check (current_streak >= 0),
  longest_streak    integer not null default 0 check (longest_streak >= 0),
  -- streak_shields: earned via bonus rounds; protect one missed streak day per 7 days
  streak_shields    smallint not null default 0 check (streak_shields >= 0),
  last_session_date date,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

-- COPPA requires a verifiable consent record before any child data is stored.
-- This table is the legal paper trail — never delete these rows, even on family deletion.
create table if not exists consent_records (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete restrict,
  -- child_id nullable: consent is recorded at signup (before child profile exists)
  --   and again when the child profile is created
  child_id      uuid references children(id) on delete set null,
  consent_type  text not null
                  check (consent_type in (
                    'coppa_data_collection',
                    'terms_of_service',
                    'privacy_policy'
                  )),
  consented_at  timestamptz not null default now(),
  -- store IP + user agent as evidence of verifiable parental consent
  ip_address    text,
  user_agent    text
);


-- =============================================================================
-- 2. CONTENT PIPELINE
-- =============================================================================

create table if not exists source_documents (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families(id) on delete cascade,
  child_id        uuid not null references children(id) on delete cascade,
  -- Supabase Storage path: documents/{family_id}/{child_id}/{filename}
  storage_path    text not null,
  filename        text not null,
  file_type       text not null
                    check (file_type in ('pptx', 'pdf', 'docx', 'doc', 'image')),
  file_size_bytes integer check (file_size_bytes > 0),
  -- metadata: auto-detected by AI, parent can confirm/edit before generating
  subject         text,
  topic_name      text,
  year_level      smallint check (year_level between 1 and 12),
  status          text not null default 'pending'
                    check (status in (
                      'pending',      -- uploaded, not yet processed
                      'processing',   -- AI pipeline running
                      'ready',        -- activities generated and available
                      'failed',       -- processing error (see error_message)
                      'needs_review'  -- low AI confidence across entire document
                    )),
  error_message   text,
  -- track which prompt version generated this document's activities
  prompt_version  text,
  uploaded_at     timestamptz not null default now(),
  processed_at    timestamptz
);

create table if not exists topics (
  id                  uuid primary key default gen_random_uuid(),
  child_id            uuid not null references children(id) on delete cascade,
  source_document_id  uuid not null references source_documents(id) on delete cascade,
  subject             text not null,
  name                text not null,
  -- e.g. "Term 3, Week 1" — display only, not used for ordering
  week_label          text,
  year_level          smallint not null check (year_level between 1 and 12),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create table if not exists concepts (
  id                        uuid primary key default gen_random_uuid(),
  topic_id                  uuid not null references topics(id) on delete cascade,
  name                      text not null,
  description               text,
  display_order             smallint not null default 0,
  -- mastery scale (PRD Section 6.4):
  --   0 = not started
  --   1 = introduced  (< 3 correct attempts)
  --   2 = practising  (3–7 correct, < 80% accuracy)
  --   3 = consolidating (≥ 80% accuracy over 2+ sessions)
  --   4 = mastered    (≥ 90% accuracy over 3+ sessions)
  mastery_level             smallint not null default 0
                              check (mastery_level between 0 and 4),
  is_skipped                boolean not null default false,
  -- UUIDs of concepts that must be mastered before this one unlocks (Phase 2)
  prerequisite_concept_ids  uuid[] not null default '{}',
  -- spaced repetition (SM-2, Phase 2 implementation):
  --   when mastery_level = 4, next_review_date drives resurfacing schedule
  --   review_interval_days grows on each successful review (1 → 3 → 7 → 14 days)
  next_review_date          date,
  review_interval_days      smallint default 1 check (review_interval_days >= 1),
  created_at                timestamptz not null default now()
);

create table if not exists activities (
  id              uuid primary key default gen_random_uuid(),
  concept_id      uuid not null references concepts(id) on delete cascade,
  activity_type   text not null
                    check (activity_type in (
                      'multiple_choice',  -- Phase 1
                      'fill_blank',       -- Phase 1
                      'drag_drop',        -- Phase 1
                      'flashcard',        -- Phase 1
                      'tap_image',        -- Phase 2
                      'order_sort',       -- Phase 2
                      'word_problem',     -- Phase 2
                      'speed'             -- Phase 2
                    )),
  -- difficulty 1–5; Phase 1 uses 1–3 only
  difficulty      smallint not null default 2 check (difficulty between 1 and 5),
  -- content JSONB schema is type-specific (see CONTENT_SCHEMAS below)
  content         jsonb not null,
  -- three-tier hint system (PRD Section 9.3):
  hint_gentle     text,   -- nudge without revealing answer
  hint_direct     text,   -- reveals a key part of the answer (Phase 2)
  hint_worked     text,   -- full step-by-step explanation
  -- AI quality signals:
  ai_confidence   float check (ai_confidence between 0 and 1),
  -- needs_review: true when ai_confidence < 0.80 — AI's signal, immutable after generation
  needs_review    boolean not null default false,
  -- review_status: the operational workflow state
  --   'pending'  → held, not served to children
  --   'approved' → served (either auto-approved by AI or human-approved)
  --   'rejected' → never served; siblings flagged for re-check
  review_status   text not null default 'pending'
                    check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_by     text,     -- reviewer identifier (UUID or name); null = auto-approved
  reviewed_at     timestamptz,
  prompt_version  text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- CONTENT_SCHEMAS (enforced at application layer via Zod, not DB constraints):
--
-- multiple_choice:
--   { question: string, image_url?: string,
--     options: [{ id: string, text: string, is_correct: boolean }] }
--
-- fill_blank:
--   { template: string, answer: string, acceptable_variants: string[],
--     keyboard_type: 'numeric' | 'text' }
--
-- drag_drop:
--   { instruction: string,
--     pairs: [{ left_id: string, left_text: string,
--               right_id: string, right_text: string }] }
--
-- flashcard:
--   { front: string, back: string }
--
-- tap_image:
--   { question: string, images: [{ id: string, url: string, is_correct: boolean }] }
--
-- order_sort:
--   { instruction: string, items: [{ id: string, text: string, correct_position: number }] }


-- =============================================================================
-- 3. SESSIONS & PROGRESS
-- =============================================================================

create table if not exists sessions (
  id                    uuid primary key default gen_random_uuid(),
  child_id              uuid not null references children(id) on delete cascade,
  -- null if session spans multiple topics (e.g. spaced repetition mix)
  topic_id              uuid references topics(id) on delete set null,
  session_type          text not null default 'standard'
                          check (session_type in (
                            'standard',
                            'bonus',
                            'speed_challenge',
                            'weekly_challenge'
                          )),
  started_at            timestamptz not null default now(),
  ended_at              timestamptz,
  total_points          integer not null default 0 check (total_points >= 0),
  activities_attempted  integer not null default 0 check (activities_attempted >= 0),
  activities_correct    integer not null default 0 check (activities_correct >= 0),
  -- which streak day this session counts for (used for streak shield logic)
  streak_day            integer
);

create table if not exists activity_attempts (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id) on delete cascade,
  activity_id     uuid not null references activities(id) on delete cascade,
  child_id        uuid not null references children(id) on delete cascade,
  -- denormalised for fast progress queries without joining through sessions
  concept_id      uuid not null references concepts(id) on delete cascade,
  is_correct      boolean not null,
  attempts_taken  smallint not null default 1 check (attempts_taken >= 1),
  hint_used       boolean not null default false,
  time_taken_ms   integer check (time_taken_ms >= 0),
  -- child_response: what the child actually submitted
  --   nullable — stored with parental consent (disclosed in privacy policy)
  --   enables "see which specific questions Karla got wrong" parent feature
  --   never logged, never sent to analytics
  child_response  jsonb,
  points_awarded  integer not null default 0 check (points_awarded >= 0),
  attempted_at    timestamptz not null default now()
);


-- =============================================================================
-- 4. QUALITY & SAFETY
-- =============================================================================

-- Separate table (not a field) so we capture: who flagged, when, why,
-- and can detect if multiple families flag the same activity (auto-removal signal).
create table if not exists activity_flags (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references activities(id) on delete cascade,
  family_id       uuid references families(id) on delete set null,
  child_id        uuid references children(id) on delete set null,
  reason          text not null
                    check (reason in (
                      'wrong_answer',
                      'confusing',
                      'inappropriate',
                      'not_from_my_material',
                      'other'
                    )),
  notes           text,
  is_resolved     boolean not null default false,
  resolved_at     timestamptz,
  flagged_at      timestamptz not null default now()
);


-- =============================================================================
-- 5. GAMIFICATION
-- =============================================================================

create table if not exists child_badges (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children(id) on delete cascade,
  -- badge_key maps to constants in application code
  -- e.g. 'first_step', 'week_one', 'fraction_champion', 'perfect_week'
  badge_key   text not null,
  earned_at   timestamptz not null default now(),
  unique (child_id, badge_key)
);

-- cosmetic-only items (Phase 2); schema added now so no migration needed later
create table if not exists child_collectibles (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references children(id) on delete cascade,
  item_key      text not null,
  earned_reason text
                  check (earned_reason in (
                    'level_up',
                    'concept_mastery',
                    'streak_7',
                    'streak_14',
                    'streak_30',
                    'weekly_challenge'
                  )),
  earned_at     timestamptz not null default now()
);


-- =============================================================================
-- 6. INDEXES
-- =============================================================================

-- families
create index if not exists idx_families_user
  on families(user_id)
  where deleted_at is null;

-- children
create index if not exists idx_children_family
  on children(family_id)
  where deleted_at is null;

-- source_documents
create index if not exists idx_documents_child_status
  on source_documents(child_id, status);

-- topics: most common query — "all active topics for this child"
create index if not exists idx_topics_child_active
  on topics(child_id)
  where is_active = true;

-- concepts: concept list for a topic, ordered for the learning path display
create index if not exists idx_concepts_topic_order
  on concepts(topic_id, display_order);

-- concepts: adaptive engine finds weakest concepts to target
create index if not exists idx_concepts_topic_mastery
  on concepts(topic_id, mastery_level);

-- concepts: spaced repetition scheduler — only mastered concepts have a review date
create index if not exists idx_concepts_spaced_rep
  on concepts(mastery_level, next_review_date)
  where mastery_level = 4;

-- activities: the hot path — adaptive engine selects approved activities per concept
create index if not exists idx_activities_concept_approved
  on activities(concept_id, difficulty, activity_type)
  where review_status = 'approved' and is_active = true;

-- activities: admin review queue — find pending items oldest-first
create index if not exists idx_activities_pending_review
  on activities(created_at)
  where review_status = 'pending';

-- sessions: parent dashboard, streak calculation
create index if not exists idx_sessions_child_date
  on sessions(child_id, started_at desc);

-- activity_attempts: progress queries and parent drill-down
create index if not exists idx_attempts_child_date
  on activity_attempts(child_id, attempted_at desc);

-- activity_attempts: "which activities has this child seen in this session?"
--   (prevents repeating activities within a session)
create index if not exists idx_attempts_session
  on activity_attempts(session_id, activity_id);

-- activity_attempts: mastery calculation per concept
create index if not exists idx_attempts_concept_child
  on activity_attempts(concept_id, child_id, is_correct);

-- activity_flags: detect repeated flags on same activity (auto-removal signal)
create index if not exists idx_flags_activity
  on activity_flags(activity_id, is_resolved);

-- activity_flags: admin unresolved queue
create index if not exists idx_flags_unresolved
  on activity_flags(flagged_at)
  where is_resolved = false;

-- child_badges: profile display
create index if not exists idx_badges_child
  on child_badges(child_id, earned_at desc);


-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================
-- All tables use RLS. The anon/publishable key (browser client) is bound by
-- these policies. The service role key (server-side AI pipeline + API routes)
-- bypasses RLS — never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

alter table families          enable row level security;
alter table children          enable row level security;
alter table consent_records   enable row level security;
alter table source_documents  enable row level security;
alter table topics            enable row level security;
alter table concepts          enable row level security;
alter table activities        enable row level security;
alter table sessions          enable row level security;
alter table activity_attempts enable row level security;
alter table activity_flags    enable row level security;
alter table child_badges      enable row level security;
alter table child_collectibles enable row level security;

-- ── families ────────────────────────────────────────────────────────────────
-- A user can only see and modify their own family.
create policy "families: owner"
  on families for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── children ────────────────────────────────────────────────────────────────
create policy "children: via family"
  on children for all
  using (
    family_id in (
      select id from families
      where user_id = auth.uid() and deleted_at is null
    )
  )
  with check (
    family_id in (
      select id from families
      where user_id = auth.uid() and deleted_at is null
    )
  );

-- ── consent_records ─────────────────────────────────────────────────────────
create policy "consent_records: via family"
  on consent_records for all
  using (
    family_id in (select id from families where user_id = auth.uid())
  )
  with check (
    family_id in (select id from families where user_id = auth.uid())
  );

-- ── source_documents ────────────────────────────────────────────────────────
create policy "source_documents: via family"
  on source_documents for all
  using (
    family_id in (select id from families where user_id = auth.uid())
  )
  with check (
    family_id in (select id from families where user_id = auth.uid())
  );

-- ── topics ──────────────────────────────────────────────────────────────────
create policy "topics: via child"
  on topics for all
  using (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid() and c.deleted_at is null
    )
  );

-- ── concepts ────────────────────────────────────────────────────────────────
create policy "concepts: via topic"
  on concepts for all
  using (
    topic_id in (
      select t.id from topics t
      join children c on c.id = t.child_id
      join families f on f.id = c.family_id
      where f.user_id = auth.uid()
    )
  );

-- ── activities ──────────────────────────────────────────────────────────────
-- Parents/children can only READ activities (never insert/update — that's the AI pipeline).
-- Service role handles all writes.
create policy "activities: read via concept"
  on activities for select
  using (
    concept_id in (
      select co.id from concepts co
      join topics t on t.id = co.topic_id
      join children c on c.id = t.child_id
      join families f on f.id = c.family_id
      where f.user_id = auth.uid()
    )
  );

-- ── sessions ────────────────────────────────────────────────────────────────
create policy "sessions: via child"
  on sessions for all
  using (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid() and c.deleted_at is null
    )
  )
  with check (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid() and c.deleted_at is null
    )
  );

-- ── activity_attempts ───────────────────────────────────────────────────────
create policy "activity_attempts: via child"
  on activity_attempts for all
  using (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid() and c.deleted_at is null
    )
  )
  with check (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid() and c.deleted_at is null
    )
  );

-- ── activity_flags ──────────────────────────────────────────────────────────
-- Families can insert flags and read their own; resolution is service-role only.
create policy "activity_flags: family insert"
  on activity_flags for insert
  with check (
    family_id in (select id from families where user_id = auth.uid())
  );

create policy "activity_flags: family read own"
  on activity_flags for select
  using (
    family_id in (select id from families where user_id = auth.uid())
  );

-- ── child_badges ────────────────────────────────────────────────────────────
create policy "child_badges: via child"
  on child_badges for all
  using (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid()
    )
  );

-- ── child_collectibles ──────────────────────────────────────────────────────
create policy "child_collectibles: via child"
  on child_collectibles for all
  using (
    child_id in (
      select c.id from children c
      join families f on f.id = c.family_id
      where f.user_id = auth.uid()
    )
  );


-- =============================================================================
-- 8. STORAGE BUCKET
-- =============================================================================
-- Creates a private 'documents' bucket for uploaded school materials.
-- Path structure: documents/{family_id}/{child_id}/{original_filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,  -- private: no public URL access
  52428800,  -- 50MB limit (PRD spec)
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do nothing;

-- Storage RLS: first path segment must be the authenticated user's family_id
create policy "documents: family upload"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (
      select id::text from families
      where user_id = auth.uid() and deleted_at is null
      limit 1
    )
  );

create policy "documents: family read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (
      select id::text from families
      where user_id = auth.uid() and deleted_at is null
      limit 1
    )
  );

create policy "documents: family delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (
      select id::text from families
      where user_id = auth.uid() and deleted_at is null
      limit 1
    )
  );


-- =============================================================================
-- DONE
--
-- Next steps after running this migration:
--
-- 1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (server-only, never NEXT_PUBLIC_)
--    Find it: Supabase dashboard → Project Settings → API → service_role secret
--
-- 2. Create a second Supabase client for server-side operations that bypass RLS:
--    src/lib/supabase/admin.ts  (uses service role key, never imported in client code)
--
-- 3. When the AI pipeline generates activities:
--    - ai_confidence >= 0.80 → set review_status = 'approved', needs_review = false
--    - ai_confidence <  0.80 → set review_status = 'pending',  needs_review = true
--    Activities are served to children only when review_status = 'approved'
--
-- 4. Admin review page (/admin/review):
--    Uses service role client to query activities where review_status = 'pending'
--    and update to 'approved' or 'rejected'. Protect with ADMIN_USER_ID env var check.
-- =============================================================================
