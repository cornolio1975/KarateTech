import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('bouts').select('*').eq('category_id', 'b27a8363-2a41-423b-b50b-89b228963174');
  if (error) {
    console.error(error);
  } else {
    console.log("Bouts:", data.filter(b => b.status === 'Completed' || b.status === 'Running' || b.victory_method));
  }
}

main();
