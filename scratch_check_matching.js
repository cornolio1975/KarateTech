const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://baoiiwfxfbvjfsfdmhjm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QuJS043IZONU1brj_3YhSA_lIUEXeM8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getAge(dobString) {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

async function testMatch() {
  const { data: cats } = await supabase.from('categories').select('*');
  const { data: parts } = await supabase.from('participants').select('*').is('deleted_at', null);

  console.log(`Loaded ${cats.length} categories and ${parts.length} participants.`);

  let matchedCount = 0;
  for (const p of parts) {
    const age = getAge(p.dob);
    const matched = cats.find(c => {
      return (
        (c.gender === 'Mixed' || c.gender === p.gender) &&
        age >= c.min_age && age <= c.max_age &&
        p.weight >= c.min_weight && p.weight <= c.max_weight &&
        c.status !== 'Closed'
      );
    });

    if (matched) {
      matchedCount++;
    } else {
      console.log(`No match for ${p.full_name}: Age ${age} (DOB ${p.dob}), Gender ${p.gender}, Weight ${p.weight}`);
    }
  }

  console.log(`\nMatched count: ${matchedCount} / ${parts.length}`);
}

testMatch();
