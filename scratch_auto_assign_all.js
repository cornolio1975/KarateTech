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

async function runAutoAssignAll() {
  console.log('=== AUTO-ASSIGNING ALL ACTIVE PARTICIPANTS ===\n');

  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  if (catErr) {
    console.error('Error fetching categories:', catErr);
    return;
  }

  const { data: parts, error: partErr } = await supabase.from('participants').select('*').is('deleted_at', null);
  if (partErr) {
    console.error('Error fetching participants:', partErr);
    return;
  }

  console.log(`Loaded ${cats.length} categories and ${parts.length} participants.`);

  let assignedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

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

    if (!matched) {
      console.log(`⚠️ No category matches rules for: ${p.full_name} (Age: ${age}, Gender: ${p.gender}, Weight: ${p.weight}kg)`);
      skippedCount++;
      continue;
    }

    // Delete existing mapping first
    await supabase.from('participant_categories').delete().eq('participant_id', p.id);

    // Insert new mapping
    const { error: insErr } = await supabase.from('participant_categories').insert([{
      participant_id: p.id,
      category_id: matched.id,
      manual_override: false
    }]);

    if (insErr) {
      console.error(`❌ Failed to assign ${p.full_name} to category "${matched.name}":`, insErr.message);
      errorCount++;
    } else {
      console.log(`✅ Assigned ${p.full_name} -> "${matched.name}"`);
      assignedCount++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully assigned: ${assignedCount}`);
  console.log(`Skipped (no matching category rules): ${skippedCount}`);
  console.log(`Errors (e.g. RLS): ${errorCount}`);
}

runAutoAssignAll();
