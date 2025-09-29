-- Ensure PostgREST can join game_signups to profiles via a proper foreign key
alter table public.game_signups
  drop constraint if exists game_signups_user_id_profiles_fkey;

alter table public.game_signups
  add constraint game_signups_user_id_profiles_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete cascade;
