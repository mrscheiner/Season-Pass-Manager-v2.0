/* Debug helper to locate unbalanced braces/parens/brackets in providers/SeasonPassProvider.tsx */

const fs = require('fs');

const filePath = process.argv[2] || 'providers/SeasonPassProvider.tsx';
const s = fs.readFileSync(filePath, 'utf8');

let i = 0;
let line = 1;
let col = 0;

/** @type {Array<{kind:'{'|'('|'[', line:number, col:number, from?:'${'}>} */
const stack = [];

/** @type {'code'|'sq'|'dq'|'tpl'|'lc'|'bc'} */
let mode = 'code';
let tplExprDepth = 0;

function adv(n = 1) {
  for (let k = 0; k < n; k++) {
    const ch = s[i++];
    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
}

function top() {
  return stack[stack.length - 1];
}

while (i < s.length) {
  const ch = s[i];
  const nx = s[i + 1];

  if (mode === 'lc') {
    if (ch === '\n') mode = 'code';
    adv();
    continue;
  }

  if (mode === 'bc') {
    if (ch === '*' && nx === '/') {
      adv(2);
      mode = 'code';
      continue;
    }
    adv();
    continue;
  }

  if (mode === 'sq') {
    if (ch === '\\') {
      adv(2);
      continue;
    }
    if (ch === "'") {
      adv();
      mode = 'code';
      continue;
    }
    adv();
    continue;
  }

  if (mode === 'dq') {
    if (ch === '\\') {
      adv(2);
      continue;
    }
    if (ch === '"') {
      adv();
      mode = 'code';
      continue;
    }
    adv();
    continue;
  }

  if (mode === 'tpl') {
    if (ch === '\\') {
      adv(2);
      continue;
    }
    if (ch === '`') {
      adv();
      mode = 'code';
      continue;
    }
    if (ch === '$' && nx === '{') {
      stack.push({ kind: '{', line, col, from: '${' });
      tplExprDepth++;
      adv(2);
      mode = 'code';
      continue;
    }
    adv();
    continue;
  }

  // mode === 'code'
  if (ch === '/' && nx === '/') {
    mode = 'lc';
    adv(2);
    continue;
  }

  if (ch === '/' && nx === '*') {
    mode = 'bc';
    adv(2);
    continue;
  }

  if (ch === "'") {
    mode = 'sq';
    adv();
    continue;
  }

  if (ch === '"') {
    mode = 'dq';
    adv();
    continue;
  }

  if (ch === '`') {
    mode = 'tpl';
    adv();
    continue;
  }

  if (ch === '{' || ch === '(' || ch === '[') {
    stack.push({ kind: ch, line, col });
    adv();
    continue;
  }

  if (ch === '}' || ch === ')' || ch === ']') {
    const want = ch === '}' ? '{' : ch === ')' ? '(' : '[';
    const t = top();

    if (!t || t.kind !== want) {
      console.log('MISMATCH close', ch, 'at', `${line}:${col}`, 'top was', t);
      process.exit(0);
    }

    const popped = stack.pop();
    adv();

    if (ch === '}' && popped.from === '${') {
      tplExprDepth--;
      if (tplExprDepth === 0) mode = 'tpl';
    }

    continue;
  }

  adv();
}

console.log('File:', filePath);
console.log('Unclosed stack size:', stack.length, 'mode:', mode, 'tplExprDepth:', tplExprDepth);
if (stack.length) {
  console.log('Top unclosed (up to 20):');
  stack.slice(-20).forEach((t, idx) => {
    console.log(String(stack.length - Math.min(20, stack.length) + idx + 1).padStart(4), t);
  });
}
