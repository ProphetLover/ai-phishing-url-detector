import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txorzenhosirozudcfyx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3J6ZW5ob3Npcm96dWRjZnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTE0NTIsImV4cCI6MjEwMzk2NzQ1Mn0.3BAj_TTgK6hZJhySsWShW99V8MFIN7jnp9z89JSoghk';

// We only initialize the client if the URL and Key are provided, 
// allowing the app to run locally without Supabase if needed.
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
