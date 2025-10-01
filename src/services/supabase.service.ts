import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { Database } from "@/types/database";

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
