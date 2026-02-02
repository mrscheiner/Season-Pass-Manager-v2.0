#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read the accurate backup data
const backupPath = path.join(__dirname, '../dev/backups/seasonpass_restore_panthers_2025.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Create an auto-restore flag file that the provider will check
const autoRestorePath = path.join(__dirname, '../.auto-restore-data.json');
fs.writeFileSync(autoRestorePath, JSON.stringify(backupData, null, 2), 'utf8');

console.log('✅ Auto-restore data file created at:', autoRestorePath);
console.log('');
console.log('The app will automatically restore this data on next launch.');
console.log('Restart the app to apply the changes.');
