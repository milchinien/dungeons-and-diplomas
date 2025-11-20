import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function - queries app_metadata table to verify DB is accessible
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("app_metadata")
      .select("key, value")
      .eq("key", "app_version")
      .single();

    if (error) {
      // If table doesn't exist yet, connection still works
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.warn("⚠️ Supabase connected, but app_metadata table not found. Run migrations!");
        return true;
      }
      console.error("❌ Supabase query error:", error);
      return false;
    }

    console.log(`✅ Supabase connection successful - App Version: ${data?.value || 'unknown'}`);
    return true;
  } catch (err) {
    console.error("❌ Supabase connection failed:", err);
    return false;
  }
}
