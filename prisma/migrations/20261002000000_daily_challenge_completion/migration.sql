-- Once-per-day daily challenge completion ledger.
--
-- The daily challenge previously tracked "already answered today" only in the
-- browser's localStorage, so clearing it (or calling the API directly) allowed
-- the 20-aura award to be claimed an unbounded number of times. This table
-- makes the server authoritative.
--
-- The unique (userId, dateKey) index IS the once-per-day guarantee: the award
-- path inserts this row first, so a duplicate attempt is rejected by Postgres
-- rather than by a read-then-write check that two requests can both pass.
-- Column types follow the Prisma schema's defaults (String -> TEXT), matching
-- the other tables created by `prisma db push`; "User"."id" is therefore TEXT
-- and the foreign key below must be TEXT too.
CREATE TABLE IF NOT EXISTS "DailyChallengeCompletion" (
    "id"         TEXT        NOT NULL,
    "userId"     TEXT        NOT NULL,
    "dateKey"    TEXT        NOT NULL,
    "questionId" TEXT,
    "isCorrect"  BOOLEAN     NOT NULL DEFAULT false,
    "earnedAura" INTEGER     NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- The once-per-day invariant. Also serves the userId lookups.
--
-- IF NOT EXISTS on both indexes because this project provisions with
-- `prisma db push`, not `migrate deploy`: there is no _prisma_migrations table,
-- so nothing records that this ran and re-applying the file is the expected way
-- to reach a fresh or drifted database. Without the guards the second run aborts
-- on the first CREATE INDEX and the FK below is never reached.
CREATE UNIQUE INDEX IF NOT EXISTS "DailyChallengeCompletion_userId_dateKey_key"
    ON "DailyChallengeCompletion"("userId", "dateKey");

CREATE INDEX IF NOT EXISTS "DailyChallengeCompletion_userId_idx"
    ON "DailyChallengeCompletion"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DailyChallengeCompletion_userId_fkey'
    ) THEN
        ALTER TABLE "DailyChallengeCompletion"
            ADD CONSTRAINT "DailyChallengeCompletion_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Same posture as 20260804000000_enable_rls: RLS on, no policies, so the
-- Supabase API roles (anon/authenticated) are denied outright. Prisma connects
-- as the table owner and bypasses RLS, so app queries are unaffected.
ALTER TABLE "DailyChallengeCompletion" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "DailyChallengeCompletion" FROM anon, authenticated;
  END IF;
END $$;
