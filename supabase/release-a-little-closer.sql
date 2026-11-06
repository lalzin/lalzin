-- ════════════════════════════════════════════════════════════════════
--  LALZIN : ajoute « A Little Closer » (pre-save) en tête des sorties,
--  à la une et en popup d'accueil. Les autres sorties perdent la popup
--  (une seule à la fois). Sans effet si le titre est déjà présent.
--  Supabase > SQL Editor > New query > Run.
-- ════════════════════════════════════════════════════════════════════
update public.site_content
set data = jsonb_set(
      data,
      '{releases}',
      jsonb_build_array(jsonb_build_object(
        'id', 'a-little-closer',
        'title', 'A Little Closer',
        'type', 'Single',
        'accent', jsonb_build_array('#FF9A2E', '#1E4E8C'),
        'cover', '/images/covers/a-little-closer.jpg',
        'href', 'https://distrokid.com/hyperfollow/lalzin/a-little-closer?ref=release',
        'featured', true,
        'announce', true,
        'presave', true
      ))
      || coalesce(
        (select jsonb_agg(r - 'announce') from jsonb_array_elements(data->'releases') r),
        '[]'::jsonb
      )
    ),
    updated_at = now()
where id = 'main'
  and not exists (
    select 1 from jsonb_array_elements(data->'releases') r
    where r->>'id' = 'a-little-closer'
  );
