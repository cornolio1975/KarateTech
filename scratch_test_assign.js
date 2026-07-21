// Test script to run autoAssignCategory on a participant and print the result/error
const fs = require('fs');
const path = require('path');
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

async function test() {
  const { data: parts, error: partErr } = await supabase.from('participants').select('*').is('deleted_at', null).limit(1);
  if (partErr) {
    console.error('Error fetching participant:', partErr);
    return;
  }
  if (!parts || parts.length === 0) {
    console.error('No participants found');
    return;
  }

  const p = parts[0];
  console.log('Testing participant:', p.full_name, 'ID:', p.id);

  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  if (catErr) {
    console.error('Error fetching categories:', catErr);
    return;
  }

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
    console.log('No matched category found for rules');
    return;
  }

  console.log('Found matched category:', matched.name, 'ID:', matched.id);

  console.log('Attempting to delete old mappings...');
  const { error: delErr } = await supabase.from('participant_categories').delete().eq('participant_id', p.id);
  if (delErr) {
    console.error('Delete mapping failed:', delErr);
  } else {
    console.log('Delete mapping succeeded!');
  }

  console.log('Attempting to insert new mapping...');
  const { error: insErr } = await supabase.from('participant_categories').insert([{
    participant_id: p.id,
    category_id: matched.id,
    manual_override: false
  }]);

  if (insErr) {
    console.error('Insert mapping failed:', insErr);
  } else {
    console.log('Insert mapping succeeded!');
  }
}

test();
