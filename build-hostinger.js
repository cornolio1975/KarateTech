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
  console.log('Build completed. Packaging /out into dist.zip...');
  if (fs.existsSync('dist.zip')) {
    fs.unlinkSync('dist.zip');
  }
  if (process.platform === 'win32') {
    execSync('powershell "Compress-Archive -Path out\\* -DestinationPath dist.zip -Force"', { stdio: 'inherit' });
  } else {
    execSync('zip -r dist.zip out/*', { stdio: 'inherit' });
  }
  console.log('✅ dist.zip updated successfully for Hostinger deployment!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

