const { execSync } = require('child_process');

console.log('Building project for GitHub Pages deployment (basePath: /KarateTech-)...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: '/KarateTech-'
    }
  });
  console.log('GitHub Pages build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
