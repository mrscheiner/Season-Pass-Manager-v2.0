const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../dev/backups/panthers_sales_2025_2026.json');

function isoTimestamp() {
  return new Date().toISOString().replace(/[:]/g, '-');
}

function safeWrite(filePath, data) {
  fs.writeFileSync(filePath, data, { encoding: 'utf8' });
}

function main() {
  if (!fs.existsSync(targetPath)) {
    console.error('Target backup file not found:', targetPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(targetPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse JSON at', targetPath, err.message);
    process.exit(1);
  }

  const timestamp = isoTimestamp();
  const backupPath = path.resolve(path.dirname(targetPath), `panthers_sales_2025_2026.json.bak.${timestamp}`);
  safeWrite(backupPath, JSON.stringify(parsed, null, 2));
  console.log('Created JSON backup:', backupPath);

  const sales = parsed.seasonPasses && parsed.seasonPasses[0] && parsed.seasonPasses[0].salesData;
  if (!sales) {
    console.log('No salesData found in the file; nothing to remove.');
    process.exit(0);
  }

  if (!Object.prototype.hasOwnProperty.call(sales, '30')) {
    console.log('No game "30" key found in salesData; nothing to remove.');
    process.exit(0);
  }

  const removed = sales['30'];
  const removedCount = Object.keys(removed || {}).length;

  // Keep a small extracted backup of the removed object for easy restore
  const extractedPath = path.resolve(path.dirname(targetPath), `game_30_sales_extracted.${timestamp}.json`);
  safeWrite(extractedPath, JSON.stringify(removed, null, 2));
  console.log('Extracted removed sales to:', extractedPath);

  // Remove the key and write the refreshed file
  delete sales['30'];
  safeWrite(targetPath, JSON.stringify(parsed, null, 2));
  console.log(`Removed game 30 sales (entries removed: ${removedCount}). Updated file written to:`, targetPath);
}

main();
