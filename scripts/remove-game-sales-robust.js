const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../dev/backups/panthers_sales_2025_2026.json');

function isoTimestamp() {
  return new Date().toISOString().replace(/[:]/g, '-');
}

function findMatchingBrace(str, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
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
  const ts = isoTimestamp();
  const rawBackup = path.resolve(path.dirname(targetPath), `panthers_sales_2025_2026.json.raw.bak.${ts}`);
  safeWrite(rawBackup, raw);
  console.log('Saved raw backup to:', rawBackup);

  const regex = /"30"\s*:\s*\{/g;
  const m = regex.exec(raw);
  if (!m) {
    console.log('No "30" key found in file. Nothing to remove.');
    process.exit(0);
  }

  const startQuote = m.index; // position of "30"
  const bracePos = raw.indexOf('{', startQuote);
  if (bracePos === -1) {
    console.error('Could not find opening brace after "30"');
    process.exit(1);
  }

  const matchEnd = findMatchingBrace(raw, bracePos);
  if (matchEnd === -1) {
    console.error('Could not find matching closing brace for game 30 object');
    process.exit(1);
  }

  let endIdx = matchEnd + 1; // one past '}'

  // include following comma if present
  while (endIdx < raw.length && /\s/.test(raw[endIdx])) endIdx++;
  if (raw[endIdx] === ',') {
    endIdx++;
  } else {
    // if there wasn't a trailing comma, try to remove a preceding comma instead (case: last in object list)
    let before = startQuote - 1;
    while (before >= 0 && /\s/.test(raw[before])) before--;
    if (raw[before] === ',') {
      // remove the comma before
      // find start of comma whitespace to remove neatly
      let commaIdx = before;
      let wsStart = commaIdx + 1;
      while (wsStart < startQuote && /\s/.test(raw[wsStart])) wsStart++;
      // we will remove the comma by shifting startQuote left to before
      startQuote = before;
    }
  }

  const removedString = raw.slice(startQuote, endIdx);

  // Try to extract the inner object JSON for the removed block (strip leading "30" : )
  const colonIndex = removedString.indexOf(':');
  let innerJson = removedString.slice(colonIndex + 1).trim();
  // Trim trailing comma if still present
  if (innerJson.endsWith(',')) innerJson = innerJson.slice(0, -1).trim();

  let parsedInner = null;
  try {
    parsedInner = JSON.parse(innerJson);
  } catch (err) {
    console.warn('Warning: could not parse removed inner JSON as standalone object. Will save raw extracted text.');
  }

  const newRaw = raw.slice(0, startQuote) + raw.slice(endIdx);

  // Validate JSON parse of newRaw
  try {
    JSON.parse(newRaw);
  } catch (err) {
    console.error('Resulting JSON after removal did not parse. Aborting and leaving raw backup in place. Error:', err.message);
    process.exit(1);
  }

  // write extracted object and new file
  const extractedPath = path.resolve(path.dirname(targetPath), `game_30_sales_extracted.${ts}.json`);
  if (parsedInner) {
    safeWrite(extractedPath, JSON.stringify(parsedInner, null, 2));
  } else {
    safeWrite(extractedPath, removedString);
  }
  console.log('Saved extracted removed block to:', extractedPath);

  safeWrite(targetPath, newRaw);
  console.log('Wrote refreshed file without game 30 to:', targetPath);
}

main();
