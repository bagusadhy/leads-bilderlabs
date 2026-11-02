-- Leads are now handed out by hand ("Bagikan ke Bagus / Andre") instead of by country.
-- Leads that are already being worked keep the person who was working them (US -> Andre, AU -> Bagus),
-- so no follow-up gets lost. Leads nobody has emailed yet stay "belum dibagi" until an admin hands them out.
UPDATE leads
   SET data = json_set(data, '$.owner', 'andre'), version = version + 1, updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
 WHERE country = 'US' AND stage NOT IN ('need', 'check', 'ready')
   AND COALESCE(json_extract(data, '$.owner'), '') = ''
   AND EXISTS (SELECT 1 FROM users WHERE username = 'andre');

UPDATE leads
   SET data = json_set(data, '$.owner', 'bagus'), version = version + 1, updated_at = strftime('%Y-%m-%d %H:%M:%f', 'now')
 WHERE country <> 'US' AND stage NOT IN ('need', 'check', 'ready')
   AND COALESCE(json_extract(data, '$.owner'), '') = ''
   AND EXISTS (SELECT 1 FROM users WHERE username = 'bagus');
