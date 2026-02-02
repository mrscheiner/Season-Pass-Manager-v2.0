const fs = require('fs');
const path = require('path');

// Read the backup file
const backupPath = path.join(__dirname, '..', 'dev', 'backups', 'seasonpass_restore_panthers_2025.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('Fixing game IDs in sales data...');

// Get the sales data
const salesData = data.recoveryData.salesData;

// Create a new sales data object with shifted IDs
const newSalesData = {};

// Process each game's sales
for (const gameId in salesData) {
  const numericId = parseInt(gameId);
  
  // If game ID is 21 or higher, shift it up by 1
  if (numericId >= 21) {
    const newGameId = (numericId + 1).toString();
    console.log(`Shifting game ${gameId} -> ${newGameId}`);
    
    // Copy the sales records but update their gameId
    newSalesData[newGameId] = {};
    for (const pairId in salesData[gameId]) {
      newSalesData[newGameId][pairId] = {
        ...salesData[gameId][pairId],
        gameId: newGameId
      };
    }
  } else {
    // Keep games 1-20 as-is
    newSalesData[gameId] = salesData[gameId];
  }
}

// Update the data
data.recoveryData.salesData = newSalesData;

// Save the fixed backup
const fixedPath = path.join(__dirname, '..', 'dev', 'backups', 'seasonpass_restore_panthers_2025_fixed.json');
fs.writeFileSync(fixedPath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n✓ Fixed backup saved to:', fixedPath);
console.log('\nGames shifted:');
const shiftedGames = Object.keys(salesData).filter(id => parseInt(id) >= 21).map(id => `${id} -> ${parseInt(id) + 1}`);
console.log(shiftedGames.join(', '));
