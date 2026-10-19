-- =========================================================================
-- Per-campaign send lock: a batch run claims the campaign until processing_until.
-- Stops the admin's manual run and the background job from sending the same
-- campaign at the same time (which could email a customer twice).
-- The claim expires on its own, so a crashed run never blocks a campaign for good.
-- Apply BEFORE deploying the code that uses it. Safe to run again.
-- =========================================================================
ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS processing_until TIMESTAMP WITH TIME ZONE;

-- Make PostgREST pick up the new column right away
NOTIFY pgrst, 'reload schema';
