-- =========================================================================
-- Unique keys on marketing_campaign_recipients.
-- saveRecipients upserts ON CONFLICT (campaign_id, customer_id): Postgres needs a unique
-- index on exactly those columns, or every campaign save fails with 42P10.
-- marketing.sql declares them, but databases whose table was created before them lack them.
-- Fails (and changes nothing) if duplicates already exist: remove them first.
-- Safe to run again.
-- =========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaign_recipients_campaign_customer_key
  ON public.marketing_campaign_recipients (campaign_id, customer_id);

-- A customer is never emailed twice by the same campaign, even under two accounts with the same email
CREATE UNIQUE INDEX IF NOT EXISTS marketing_campaign_recipients_campaign_email_key
  ON public.marketing_campaign_recipients (campaign_id, lower(email));

NOTIFY pgrst, 'reload schema';
