import { createClient } from "@supabase/supabase-js";

// Server only: pakai service role key, jangan diimpor dari client component.
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
