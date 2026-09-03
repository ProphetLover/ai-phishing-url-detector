import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txorzenhosirozudcfyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3J6ZW5ob3Npcm96dWRjZnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTE0NTIsImV4cCI6MjEwMzk2NzQ1Mn0.3BAj_TTgK6hZJhySsWShW99V8MFIN7jnp9z89JSoghk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  console.log("Testing insert...");
  const insertResult = await supabase.from('url_analyses').insert({
    url_hash: 'test-hash',
    sanitized_display_url: 'https://test.com',
    prediction: 'Legitimate',
    risk_score: 15,
    confidence: 0.95,
    model_version: 'v1.0',
    features_json: { length: 16 }
  }).select();
  
  console.log("Insert result:", insertResult.error || insertResult.data);
  
  console.log("Testing select...");
  const selectResult = await supabase.from('url_analyses').select('*');
  console.log("Select result:", selectResult.error || selectResult.data);
}

testSupabase();
