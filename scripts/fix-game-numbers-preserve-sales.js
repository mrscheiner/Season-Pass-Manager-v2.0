#!/usr/bin/env node
/**
 * Fix game numbers while preserving all sales data
 * This script:
 * 1. Loads the backup with sales data (but wrong game numbers)
 * 2. Loads the correct schedule from panthersSchedule.ts
 * 3. Merges them, keeping sales but fixing game numbers
 */

const fs = require('fs');
const path = require('path');

// Paths
const backupPath = path.join(__dirname, '../dev/backups/seasonpass_restore_panthers_2025.json');
const schedulePath = path.join(__dirname, '../constants/panthersSchedule.ts');
const outputPath = path.join(__dirname, '../dev/backups/seasonpass_fixed_game_numbers.json');

console.log('\n========== FIX GAME NUMBERS (PRESERVE SALES) ==========\n');

// Load backup with sales data
console.log('📂 Loading backup with sales data...');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const salesData = backup.recoveryData.salesData;
const salesCount = Object.values(salesData).reduce((total, game) => {
  return total + Object.keys(game).length;
}, 0);
console.log(`✅ Loaded ${salesCount} sales from backup`);

// Parse the schedule TypeScript file to extract PANTHERS_20252026_SCHEDULE
console.log('\n📂 Loading correct schedule from panthersSchedule.ts...');
const scheduleContent = fs.readFileSync(schedulePath, 'utf8');

// Extract the schedule array - find the export statement
const scheduleMatch = scheduleContent.match(/export const PANTHERS_20252026_SCHEDULE[^=]*=\s*(\[[\s\S]*?\n\];)/);
if (!scheduleMatch) {
  console.error('❌ Could not find PANTHERS_20252026_SCHEDULE in panthersSchedule.ts');
  process.exit(1);
}

// Convert TypeScript to JSON by:
// 1. Remove TypeScript type annotations
// 2. Add quotes to unquoted keys
// 3. Replace function calls with null (we'll fix logos later)
// 4. Handle date strings properly
let scheduleArrayStr = scheduleMatch[1];
scheduleArrayStr = scheduleArrayStr.replace(/\s*as Game\[\]/g, '');
scheduleArrayStr = scheduleArrayStr.replace(/([{,]\s*)(\w+):/g, '$1"$2":');
// Replace getOpponentLogo() calls with null - we don't need logos for this
scheduleArrayStr = scheduleArrayStr.replace(/getOpponentLogo\([^)]*\)/g, 'null');

// Evaluate the array safely
let correctSchedule;
try {
  correctSchedule = eval(scheduleArrayStr);
  console.log(`✅ Loaded ${correctSchedule.length} games from schedule`);
} catch (error) {
  console.error('❌ Error parsing schedule:', error.message);
  console.error('First 500 chars of scheduleArrayStr:', scheduleArrayStr.substring(0, 500));
  process.exit(1);
}

// Create mapping of old game IDs to correct games
console.log('\n🔄 Mapping sales data to correct games...');

// The backup has sales keyed by game ID (1, 2, 3, etc.)
// We need to map these to the correct games with proper numbering

// Build a mapping: oldGameNumber -> correctGame
// Assumption: games are in order, so backup game "1" -> first regular season game in schedule
const preseasonGames = correctSchedule.filter(g => g.gameNumber.startsWith('PS'));
const regularSeasonGames = correctSchedule.filter(g => !g.gameNumber.startsWith('PS'));

console.log(`  - ${preseasonGames.length} preseason games`);
console.log(`  - ${regularSeasonGames.length} regular season games`);

// Create the corrected sales data structure
const correctedSalesData = {};

// Map old game IDs to new game IDs
// The backup probably has:
//   "1" -> should be PS 1
//   "2" -> should be PS 2  
//   "3" -> should be 1 (first regular season)
//   etc.

// Check what game IDs exist in the backup
const backupGameIds = Object.keys(salesData);
console.log(`\n📊 Backup has sales for ${backupGameIds.length} games`);
console.log(`   All game IDs: ${backupGameIds.join(', ')}`);

// The backup is missing games 21 and 28, so we need to map:
// Backup game 22 -> Schedule game 21 (Tampa Bay on 12/27)
// Backup game 23 -> Schedule game 22
// Backup game 24 -> Schedule game 23
// ... and so on
const gameIdMapping = {
  'p1': 'p1',
  'p2': 'p2',
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
  '11': '11', '12': '12', '13': '13', '14': '14', '15': '15',
  '16': '16', '17': '17', '18': '18', '19': '19', '20': '20',
  // Game 21 missing in backup, backup's 22 becomes 21
  '22': '21',  // Tampa Bay Lightning 12/27
  '23': '22',  // Washington Capitals 12/29
  '24': '23',  // Montreal Canadiens
  '25': '24',  // New York Rangers
  '26': '25',  // Colorado Avalanche
  '27': '26',  // San Jose Sharks
  // Game 28 missing in backup, backup's 29 becomes 27
  '29': '27',  // Utah Hockey Club
  '30': '28'   // Skip 29, map to 28
};

// Map each backup game to the correct schedule game
backupGameIds.forEach(oldId => {
  const sales = salesData[oldId];
  
  // Find the corresponding correct game
  let correctGame;
  
  const targetId = gameIdMapping[oldId];
  if (!targetId) {
    console.log(`  ⚠️  No mapping defined for backup game ${oldId}`);
    return;
  }
  
  // Find the game with this ID in the schedule
  correctGame = correctSchedule.find(g => g.id === targetId);
  
  if (correctGame) {
    // Update the gameId in each sale to match the correct game ID
    const correctedGameSales = {};
    Object.keys(sales).forEach(pairId => {
      const sale = { ...sales[pairId] };
      sale.gameId = correctGame.id; // Update to correct game ID
      correctedGameSales[pairId] = sale;
    });
    
    correctedSalesData[correctGame.id] = correctedGameSales;
    
    const saleCount = Object.keys(sales).length;
    console.log(`  ✓ Game ${oldId} -> ${correctGame.gameNumber} (${correctGame.opponent}, ${saleCount} sales)`);
  } else {
    console.log(`  ⚠️  No matching game found for backup game ${oldId}`);
  }
});

// Create the corrected restore file
const correctedRestore = {
  contextMarkers: backup.contextMarkers,
  recoveryData: {
    ...backup.recoveryData,
    timestamp: new Date().toISOString(),
    salesData: correctedSalesData
  }
};

// Verify sale count matches
const correctedSalesCount = Object.values(correctedSalesData).reduce((total, game) => {
  return total + Object.keys(game).length;
}, 0);

console.log(`\n✅ Sales preserved: ${correctedSalesCount}/${salesCount}`);

if (correctedSalesCount !== salesCount) {
  console.error('⚠️  WARNING: Sale count mismatch!');
}

// Save the corrected restore file
fs.writeFileSync(outputPath, JSON.stringify(correctedRestore, null, 2));
console.log(`\n💾 Saved corrected restore file to:`);
console.log(`   ${outputPath}`);

// Also create a copy in ~/Documents for iPhone access
const homePath = require('os').homedir();
const documentsPath = path.join(homePath, 'Documents', 'PANTHERS_RESTORE_FIXED.json');
fs.writeFileSync(documentsPath, JSON.stringify(correctedRestore, null, 2));
console.log(`\n📱 Also saved to iPhone-accessible location:`);
console.log(`   ${documentsPath}`);

console.log('\n========== DONE ==========\n');
console.log('Next steps:');
console.log('1. Go to Settings tab in your app');
console.log('2. Tap "Restore from Backup"');
console.log('3. Select the PANTHERS_RESTORE_FIXED.json file');
console.log('4. All sales will be preserved with correct game numbers!');
console.log('');
