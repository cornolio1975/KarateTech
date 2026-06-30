const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseKey = keyMatch[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in .env.local');
  process.exit(1);
}

console.log(`Connected to Supabase URL: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to clean parsed SQL values
function cleanValue(val) {
  val = val.trim();
  if (val.toUpperCase() === 'NULL') return null;
  if (val.toUpperCase() === 'TRUE') return true;
  if (val.toUpperCase() === 'FALSE') return false;
  if (val.toUpperCase() === 'NOW()') return new Date().toISOString();
  
  if (val.toUpperCase().includes('NOW() - INTERVAL')) {
    const match = val.match(/INTERVAL\s+'(\d+)\s+days'/i);
    if (match) {
      const days = parseInt(match[1]);
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString();
    }
    return new Date().toISOString();
  }

  // Check if numeric
  if (!isNaN(val) && val !== '' && !val.startsWith("'") && !val.endsWith("'")) {
    return Number(val);
  }

  // Strip single quotes
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
}

// Helper to parse individual row values
function parseRowValues(rowStr, columns) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;
  
  const str = rowStr.trim();
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "'" && str[i-1] !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else {
        inQuotes = false;
        quoteChar = null;
      }
      current += char;
    } else if (char === ',' && !inQuotes) {
      values.push(cleanValue(current));
      current = '';
    } else {
      current += char;
    }
  }
  values.push(cleanValue(current));
  
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = values[idx];
  });
  return obj;
}

async function run() {
  try {
    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('Error: supabase_schema.sql file not found');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Split statements by semicolon
    const statements = sqlContent.split(';');

    for (let rawStatement of statements) {
      // Basic cleanup
      let statement = rawStatement.trim();
      
      // Remove SQL line comments
      statement = statement
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

      if (!statement.toUpperCase().startsWith('INSERT INTO')) {
        continue;
      }

      // Parse INSERT statement
      const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+)/i;
      const match = statement.match(insertRegex);
      if (!match) {
        console.warn(`Could not parse INSERT statement: ${statement.substring(0, 50)}...`);
        continue;
      }

      const tableName = match[1].trim();
      const cols = match[2].split(',').map(c => c.trim());
      let valuesPart = match[3].trim();

      // Extract ON CONFLICT columns
      let conflictCols = '';
      const conflictMatch = valuesPart.match(/ON\s+CONFLICT\s*\(([^)]+)\)/i);
      if (conflictMatch) {
        conflictCols = conflictMatch[1].split(',').map(c => c.trim()).join(',');
      }

      // Strip ON CONFLICT clause if present
      const conflictIndex = valuesPart.toUpperCase().indexOf('ON CONFLICT');
      if (conflictIndex !== -1) {
        valuesPart = valuesPart.substring(0, conflictIndex).trim();
      }

      // Split rows by matching custom balancing parentheses
      const rows = [];
      let current = '';
      let depth = 0;
      let inQuotes = false;
      let collecting = false;

      for (let i = 0; i < valuesPart.length; i++) {
        const char = valuesPart[i];
        if (char === "'" && valuesPart[i-1] !== '\\') {
          inQuotes = !inQuotes;
        }

        if (char === '(' && !inQuotes) {
          if (depth === 0) {
            collecting = true;
          }
          depth++;
        }

        if (collecting) {
          current += char;
        }

        if (char === ')' && !inQuotes) {
          depth--;
          if (depth === 0) {
            // Strip outer parentheses
            let cleaned = current.trim();
            if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
              cleaned = cleaned.slice(1, -1).trim();
            }
            rows.push(cleaned);
            current = '';
            collecting = false;
          }
        }
      }

      if (rows.length === 0) {
        console.log(`No rows extracted for table ${tableName}`);
        continue;
      }

      // Map rows to objects
      const records = rows.map(r => parseRowValues(r, cols));
      console.log(`Upserting ${records.length} records into table: ${tableName}...`);

      const upsertOptions = {};
      if (conflictCols) {
        upsertOptions.onConflict = conflictCols;
      }

      const { data, error } = await supabase.from(tableName).upsert(records, upsertOptions);
      if (error) {
        console.error(`Error inserting into ${tableName}:`, error.message);
      } else {
        console.log(`Successfully seeded table: ${tableName}`);
      }
    }

    console.log('\nAll seed operations finished!');
  } catch (err) {
    console.error('Unhandled error during seeding:', err);
  }
}

run();
