-- Remove the "three small changes to your Google listing" promise from the personalised Email 1 texts.
-- Bumping version/updated_at makes open dashboards pick up the new text automatically.
UPDATE leads
SET data = REPLACE(data, ' I''ll also include three small changes to your Google listing that could help bring in more calls.', ''),
    version = version + 1,
    updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
WHERE data LIKE '%three small changes to your Google listing%';
