const fs = require('fs');
const path = require('path');
const LZString = require('lz-string');

// Read the accurate sales data - using the restore version
const backupPath = path.join(__dirname, '../dev/backups/seasonpass_restore_panthers_2025.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Output as a recovery code that can be pasted into the app
const compressed = LZString.compressToBase64(JSON.stringify(backupData));

console.log('='.repeat(80));
console.log('ACCURATE SALES DATA RECOVERY CODE');
console.log('='.repeat(80));
console.log('');
console.log('Copy the code below and paste it into the app:');
console.log('Settings > Restore from Recovery Code');
console.log('');
console.log('='.repeat(80));
console.log(compressed);
console.log('='.repeat(80));
console.log('');
console.log(`Code length: ${compressed.length} characters`);
console.log('');

// Also save to a file for easy access
const outputPath = path.join(__dirname, '../dev/backups/latest_recovery_code.txt');
fs.writeFileSync(outputPath, compressed, 'utf8');
console.log(`✅ Recovery code saved to: ${outputPath}`);
console.log('');
console.log('To restore:');
console.log('1. Open the app');
console.log('2. Go to Settings tab');
console.log('3. Tap "Restore from Recovery Code"');
console.log('4. Paste the code from the file above or copy from terminal');
console.log('5. Tap "Restore"');
