const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building project for Hostinger deployment (no basePath)...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: ''
    }
  });

  // Create a zip of the 'out' folder for easy upload to Hostinger
  console.log('Build completed. Output is in the /out folder.');
  console.log('Upload the contents of /out to your Hostinger public_html directory.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
