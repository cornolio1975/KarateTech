const SUPABASE_URL = 'https://baoiiwfxfbvjfsfdmhjm.supabase.co';
const ANON_KEY = 'sb_publishable_QuJS043IZONU1brj_3YhSA_lIUEXeM8';

async function calculateAge(dobString) {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

async function run() {
  const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  // 1. Fetch all participants
  console.log('Fetching participants...');
  const pRes = await fetch(`${SUPABASE_URL}/rest/v1/participants?select=*&is=deleted_at.null`, { headers });
  const participants = await pRes.json();
  
  // 2. Fetch all categories
  console.log('Fetching categories...');
  const cRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, { headers });
  const categories = await cRes.json();

  console.log(`Found ${participants.length} participants and ${categories.length} categories.`);

  const mappings = [];

  // 3. Auto-assign
  for (const p of participants) {
    const age = await calculateAge(p.dob);
    const matched = categories.find(c => {
      return (
        c.gender === p.gender &&
        age >= c.min_age && age <= c.max_age &&
        p.weight >= c.min_weight && p.weight <= c.max_weight &&
        c.status !== 'Closed'
      );
    });

    if (matched) {
      mappings.push({
        participant_id: p.id,
        category_id: matched.id,
        manual_override: false
      });
    }
  }

  console.log(`Prepared ${mappings.length} category mappings. Inserting into Supabase...`);

  if (mappings.length > 0) {
    // Delete existing mappings first just in case
    await fetch(`${SUPABASE_URL}/rest/v1/participant_categories`, {
      method: 'DELETE',
      headers,
    });
    
    // Insert new mappings
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/participant_categories`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(mappings)
    });

    if (insertRes.ok) {
      console.log('Successfully inserted mappings into Supabase!');
    } else {
      console.error('Failed to insert mappings:', await insertRes.text());
    }
  } else {
    console.log('No eligible mappings found to insert.');
  }
}

run().catch(console.error);
