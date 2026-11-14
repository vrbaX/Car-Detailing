-- Initial service catalog for VRB DETAILING.
-- Durations and buffers are operational starting estimates; adjust them to the real workflow.
insert into public.service_catalog (name, description, estimated_minutes, buffer_minutes, active, sort_order)
select v.name, v.description, v.estimated_minutes, v.buffer_minutes, true, v.sort_order
from (values
  ('Čištění interiéru', 'Hloubkové vyčištění interiéru včetně čalounění, koberců a plastů.', 240, 60, 1),
  ('Péče o exteriér', 'Šetrné ruční mytí a dekontaminace povrchu vozu.', 120, 45, 2),
  ('Korekce laku', 'Leštění laku podle jeho stavu a rozsahu požadované korekce.', 360, 90, 3),
  ('Ochrana laku', 'Příprava povrchu a aplikace ochranného povlaku.', 480, 120, 4)
) as v(name, description, estimated_minutes, buffer_minutes, sort_order)
where not exists (
  select 1 from public.service_catalog existing where existing.name = v.name
);
