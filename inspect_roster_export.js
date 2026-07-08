const fs = require('fs');
const csvPath = 'C:\\Users\\svana\\Downloads\\Karate_Roster_Export_1783406402767.csv';

function run() {
  if (!fs.existsSync(csvPath)) {
    console.error('File not found:', csvPath);
    process.exit(1);
  }
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}

run();
