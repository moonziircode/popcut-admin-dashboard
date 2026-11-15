import { createClient } from '@supabase/supabase-js';

// Server-side only admin client with service_role key
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxefecxvforrrbggmvmm.supabase.co';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWZlY3h2Zm9ycnJiZ2dtdm1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDY3NjA3NCwiZXhwIjoyMTEwMjUyMDc0fQ.H8a2gkukjzzc_jA04aWIFFsfYf2p9MUuNx_0V5pmtE4';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
