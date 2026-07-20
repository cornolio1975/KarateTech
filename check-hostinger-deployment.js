#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  KarateTech - Hostinger Deployment Checker                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Check 1: Verify build output exists
console.log('1. Checking build output...');
const outDir = path.join(__dirname, 'out');
if (fs.existsSync(outDir)) {
  const files = fs.readdirSync(outDir);
  console.log(`   ✓ /out directory exists with ${files.length} items`);
} else {
  console.log('   ✗ /out directory NOT found. Run: npm run build');
  process.exit(1);
}

// Check 2: Verify index.html
console.log('\n2. Checking index.html...');
const indexPath = path.join(outDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const stats = fs.statSync(indexPath);
  console.log(`   ✓ index.html exists (${Math.round(stats.size / 1024)}KB)`);
} else {
  console.log('   ✗ index.html NOT found');
  process.exit(1);
}

// Check 3: Verify _next folder
console.log('\n3. Checking Next.js assets...');
const nextDir = path.join(outDir, '_next');
if (fs.existsSync(nextDir)) {
  const items = fs.readdirSync(nextDir);
  console.log(`   ✓ _next directory exists with ${items.length} items`);
} else {
  console.log('   ✗ _next directory NOT found');
  process.exit(1);
}

// Check 4: Verify .htaccess
console.log('\n4. Checking .htaccess...');
const htaccessPath = path.join(__dirname, 'public', '.htaccess');
if (fs.existsSync(htaccessPath)) {
  console.log('   ✓ .htaccess exists');
} else {
  console.log('   ✗ .htaccess NOT found in /public');
  process.exit(1);
}

// Check 5: Environment check
console.log('\n5. Checking environment configuration...');
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('   ✓ .env.example exists');
  console.log('   ℹ Before deploying, create .env.local with:');
  console.log('     NEXT_PUBLIC_SUPABASE_URL=<your-url>');
  console.log('     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>');
  console.log('     NEXT_PUBLIC_BASE_PATH=');
} else {
  console.log('   ✗ .env.example NOT found');
}

// Check 6: Calculate total size
console.log('\n6. Calculating deployment size...');
const getSize = (dir) => {
  let size = 0;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      size += getSize(filePath);
    } else {
      size += stat.size;
    }
  });
  return size;
};

const totalSize = getSize(outDir);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
console.log(`   ℹ Total deployment size: ${sizeMB}MB`);
if (sizeMB > 500) {
  console.log('   ⚠ Large deployment - may take a while to upload');
}

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  ✓ Deployment Check Complete                                  ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║  Next Steps:                                                   ║');
console.log('║  1. Upload all files from /out to public_html/                ║');
console.log('║  2. Upload .htaccess to public_html/                          ║');
console.log('║  3. Verify file permissions (644 for files, 755 for dirs)    ║');
console.log('║  4. Test: https://slategray-monkey-804118.hostingersite.com/ ║');
console.log('║                                                                ║');
console.log('║  See HOSTINGER_DEPLOYMENT.md for detailed instructions        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
