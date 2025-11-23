-- 027_create_profile_setup.sql
-- Create `profiles` (authoritative per-user profile), `profile_setup` (per-step jsonb)
-- a pivot view for convenient frontend reads, and a denormalized `profile_detail` table
-- with helper RPCs to upsert step rows and to upsert the denormalized profile details.

-- 1) Authoritative profiles table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  interests text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

COMMENT ON TABLE public.profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.profiles.user_id IS 'References auth.users.id (1:1 relationship)';
COMMENT ON COLUMN public.profiles.display_name IS 'User display name shown in app';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image (Supabase Storage)';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';
COMMENT ON COLUMN public.profiles.interests IS 'Array of user interests for matching';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Soft delete timestamp (NULL = active)';

-- 2) Per-step profile_setup table (one row per user + step)
CREATE TABLE IF NOT EXISTS public.profile_setup (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step integer NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, step)
);

COMMENT ON TABLE public.profile_setup IS 'Storage for in-progress profile setup; one row per user/step.';

-- 3) Helper trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- Attach trigger to profile_setup to keep updated_at current
DROP TRIGGER IF EXISTS update_profile_setup_updated_at ON public.profile_setup;
CREATE TRIGGER update_profile_setup_updated_at
BEFORE UPDATE ON public.profile_setup
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RPC: upsert entire step JSON for a user
-- Usage: SELECT public.upsert_profile_setup_step(user_uuid, step_int, data_jsonb, region_text);
CREATE OR REPLACE FUNCTION public.upsert_profile_setup_step(
  _user_id uuid,
  _step integer,
  _data jsonb,
  _region text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profile_setup (user_id, step, data, region)
  VALUES (_user_id, _step, _data, _region)
  ON CONFLICT (user_id, step) DO UPDATE
  SET data = EXCLUDED.data,
      region = COALESCE(EXCLUDED.region, public.profile_setup.region),
      updated_at = now();
END;
$$;

-- 6) Denormalized aggregated table for fast reads
CREATE TABLE IF NOT EXISTS public.profile_detail (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  interests text[] DEFAULT '{}',
  learning_style text,
  available_times jsonb,
  flexible boolean,
  categories jsonb,
  region text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_detail IS 'Denormalized profile details for fast reads (aggregates profiles + profile_setup)';

-- Attach trigger to profile_detail to keep updated_at current
DROP TRIGGER IF EXISTS update_profile_detail_updated_at ON public.profile_detail;
CREATE TRIGGER update_profile_detail_updated_at
BEFORE UPDATE ON public.profile_detail
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) RPC: upsert profile_detail from a json payload (convenience helper)
-- Accepts both snake_case and camelCase keys for compatibility.
CREATE OR REPLACE FUNCTION public.upsert_profile_detail(
  _user_id uuid,
  _data jsonb
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profile_detail (
    user_id, display_name, avatar_url, bio, interests,
    learning_style, available_times, flexible, categories, region
  )
  VALUES (
    _user_id,
    COALESCE(_data->> 'display_name', _data->> 'displayName'),
    COALESCE(_data->> 'avatar_url', _data->> 'avatarUrl'),
    COALESCE(_data->> 'bio', _data->> 'bio'),
    -- normalize interests: convert jsonb array to text[] and default to empty array
    (SELECT COALESCE(array_agg(x), ARRAY[]::text[]) FROM jsonb_array_elements_text(COALESCE(_data-> 'interests', '[]'::jsonb)) AS t(x)),
    COALESCE(_data->> 'learning_style', _data->> 'learningStyle'),
    COALESCE(_data-> 'available_times', _data-> 'availableTimes'),
    (CASE WHEN COALESCE(_data->> 'flexible', _data->> 'flexible') IS NULL THEN NULL ELSE COALESCE(_data->> 'flexible', _data->> 'flexible')::boolean END),
    COALESCE(_data-> 'categories', '[]'::jsonb),
    COALESCE(_data->> 'region', _data->> 'region')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = COALESCE(EXCLUDED.display_name, public.profile_detail.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profile_detail.avatar_url),
    bio = COALESCE(EXCLUDED.bio, public.profile_detail.bio),
    interests = COALESCE(EXCLUDED.interests, public.profile_detail.interests),
    learning_style = COALESCE(EXCLUDED.learning_style, public.profile_detail.learning_style),
    available_times = COALESCE(EXCLUDED.available_times, public.profile_detail.available_times),
    flexible = COALESCE(EXCLUDED.flexible, public.profile_detail.flexible),
    categories = COALESCE(EXCLUDED.categories, public.profile_detail.categories),
    region = COALESCE(EXCLUDED.region, public.profile_detail.region),
    updated_at = now();
END;
$$;

-- 8) (Optional) Grant execute to authenticated role so clients can call RPCs directly
-- Uncomment if you use RLS and want authenticated clients to call these functions
-- GRANT EXECUTE ON FUNCTION public.upsert_profile_setup_step(uuid, integer, jsonb, text) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.upsert_profile_detail(uuid, jsonb) TO authenticated;

-- End of migration 027