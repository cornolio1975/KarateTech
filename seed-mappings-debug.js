const SUPABASE_URL = 'https://baoiiwfxfbvjfsfdmhjm.supabase.co';
const ANON_KEY = 'sb_publishable_QuJS043IZONU1brj_3YhSA_lIUEXeM8';

async function run() {
  const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  const pRes = await fetch(`${SUPABASE_URL}/rest/v1/participants?select=*`, { headers });
  const rawP = await pRes.text();
  console.log("Raw participants:", pRes.status, rawP.substring(0, 100));
}

run().catch(console.error);
