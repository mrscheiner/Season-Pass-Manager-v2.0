const fs = require('fs');
const p = process.argv[2] || 'scripts/panthers-recovery-full.json';
try {
  const r = fs.readFileSync(p, 'utf8');
  const j = JSON.parse(r);
  const sd = (j.recoveryData && j.recoveryData.salesData) || j.salesData || (j.seasonPasses && j.seasonPasses[0] && j.seasonPasses[0].salesData);
  if (!sd) {
    console.error('No salesData found in', p);
    process.exit(1);
  }
  const games = Object.keys(sd).length;
  let salesCount = 0;
  Object.values(sd).forEach(g => { salesCount += Object.keys(g || {}).length; });
  console.log('file:', p);
  console.log('games:', games);
  console.log('totalSalesEntries:', salesCount);
  console.log('hasGame30:', Object.prototype.hasOwnProperty.call(sd, '30'));
} catch (err) {
  console.error('Error reading/parsing', p, err.message || err);
  process.exit(2);
}
