-- ════════════════════════════════════════════════════════════════════
-- Optional sample data for local testing.
-- Run AFTER schema.sql. Replace the email with one you can receive
-- magic-link emails at, so you can log in to the Partner Portal.
-- ════════════════════════════════════════════════════════════════════

-- 1) A sample partner
insert into public.partners (name, email, instagram, status, commission_link, partner_message)
values (
  'Ava Monroe',
  'partner@example.com',
  '@avamonroe',
  'Active Partner',
  'https://planetbylaureng.com/?ref=avamonroe',
  null
)
on conflict (email) do nothing;

-- 2) A kit for that partner
with p as (select id from public.partners where email = 'partner@example.com')
insert into public.kits (partner_id, status, ship_date, tracking_number, return_by_date, notes)
select p.id, 'Delivered', current_date - 7, '1Z999AA10123456784', current_date + 14,
       'Shipped fall capsule. Following up on content next week.'
from p
where not exists (select 1 from public.kits k where k.partner_id = p.id);

-- 3) Pieces in that kit
with k as (
  select k.id from public.kits k
  join public.partners p on p.id = k.partner_id
  where p.email = 'partner@example.com'
  order by k.created_at desc limit 1
)
insert into public.kit_pieces (kit_id, piece_name, color, photo_url, partner_decision)
select k.id, v.piece_name, v.color, v.photo_url, v.partner_decision
from k, (values
  ('The Lauren Blazer', 'Espresso', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', null),
  ('Silk Slip Dress',   'Champagne', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', null),
  ('Cashmere Wrap',     'Warm Cream', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', null)
) as v(piece_name, color, photo_url, partner_decision)
where not exists (
  select 1 from public.kit_pieces kp where kp.kit_id = k.id
);

-- 4) A couple of content log entries
with p as (select id from public.partners where email = 'partner@example.com')
insert into public.content_log (partner_id, content_type, post_date, notes)
select p.id, v.content_type, v.post_date, v.notes
from p, (values
  ('Reel'::text, (current_date - 3)::date, 'Unboxing reel — 12k views'::text),
  ('Story'::text, (current_date - 1)::date, '3-frame story with link sticker'::text)
) as v(content_type, post_date, notes)
where not exists (select 1 from public.content_log c where c.partner_id = p.id);
