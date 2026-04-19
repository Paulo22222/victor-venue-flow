-- Add username column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique index (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON public.profiles (LOWER(username))
WHERE username IS NOT NULL;

-- Update handle_new_user to capture username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();