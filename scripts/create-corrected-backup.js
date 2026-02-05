const fs = require('fs');
const path = require('path');

const defaultInputPath = path.join(__dirname, '../dev/backups/seasonpass_restore_panthers_2025.json');
const inputPath = process.argv[2] || defaultInputPath;

if (!fs.existsSync(inputPath)) {
  console.error('❌ Input backup file not found.');
  console.error('Expected:', inputPath);
  console.error('Usage: node scripts/create-corrected-backup.js <inputBackupJson> [outputJson]');
  process.exit(1);
}

// Read the old backup with sales data
const oldBackup = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Read and parse the TypeScript schedule file
const scheduleContent = fs.readFileSync(path.join(__dirname, '../constants/panthersSchedule.ts'), 'utf8');

// Extract the schedule array from the file
// Match the entire export const PANTHERS_20252026_SCHEDULE: Game[] = [...] array
const scheduleMatch = scheduleContent.match(/export const PANTHERS_20252026_SCHEDULE[^=]*=\s*(\[[\s\S]*?\n\];)/);
if (!scheduleMatch) {
  console.error('❌ Could not extract schedule from TypeScript file');
  process.exit(1);
}

// Evaluate the array (it's valid JSON-like structure)
const scheduleArrayStr = scheduleMatch[1];
const PANTHERS_20252026_SCHEDULE = eval(scheduleArrayStr);

console.log('📊 Creating corrected backup...');
console.log('Old games count:', oldBackup.games.length);
console.log('Correct schedule count:', PANTHERS_20252026_SCHEDULE.length);

// Create new backup with correct schedule and existing sales data
const correctedBackup = {
  ...oldBackup,
  games: PANTHERS_20252026_SCHEDULE,
  createdAtISO: new Date().toISOString()
};

// Save the corrected backup
const backupsDir = path.join(__dirname, '../dev/backups');
fs.mkdirSync(backupsDir, { recursive: true });
const defaultOutputPath = path.join(backupsDir, 'panthers_2025_2026_CORRECTED.json');
const outputPath = process.argv[3] || defaultOutputPath;
fs.writeFileSync(outputPath, JSON.stringify(correctedBackup, null, 2));

console.log('✅ Corrected backup created!');
console.log('📁 File:', outputPath);
console.log('🎮 Games:', correctedBackup.games.length);
console.log('💰 Sales records:', Object.keys(correctedBackup.salesData || {}).reduce((sum, gameId) => {
  return sum + Object.keys(correctedBackup.salesData[gameId] || {}).length;
}, 0));
console.log('\n🔧 Now use "Restore from File" in the app settings to load this file.');
