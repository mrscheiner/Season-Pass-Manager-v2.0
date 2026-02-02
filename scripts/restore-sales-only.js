#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BACKUP_PATH = path.join(__dirname, '../dev/backups/panthers_sales_2025_2026.json');

console.log('[Restore Sales] Loading backup from:', BACKUP_PATH);

let backupData;
try {
  const rawData = fs.readFileSync(BACKUP_PATH, 'utf8');
  backupData = JSON.parse(rawData);
  console.log('[Restore Sales] ✅ Backup loaded successfully');
} catch (error) {
  console.error('[Restore Sales] ❌ Failed to load backup:', error.message);
  process.exit(1);
}

// Count sales
const salesGames = Object.keys(backupData.salesData || {});
const totalSales = salesGames.reduce((sum, gameId) => {
  return sum + Object.keys(backupData.salesData[gameId] || {}).length;
}, 0);

console.log('[Restore Sales] Sales data summary:');
console.log('  Games with sales:', salesGames.length);
console.log('  Total sale records:', totalSales);
console.log('  Games:', salesGames.sort().join(', '));

// Create recovery code to paste in app
const LZString = require('lz-string');
const compressed = LZString.compressToBase64(JSON.stringify(backupData));
console.log('\n[Restore Sales] Recovery Code (copy this):');
console.log('─'.repeat(80));
console.log(compressed);
console.log('─'.repeat(80));
console.log('\n[Restore Sales] Code length:', compressed.length, 'characters');
console.log('\n✅ Copy the code above and paste it in Settings > Restore from Code');
