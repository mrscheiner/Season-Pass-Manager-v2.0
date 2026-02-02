#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WATCHER_PORT || 3001;
const WATCH_BACKUPS_DIR = path.resolve(__dirname, '..', 'backups');

function sendSSEHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
}

function readBackupData() {
  const codePath = path.join(WATCH_BACKUPS_DIR, 'latest_recovery_code.txt');
  const restoreJsonPath = path.join(WATCH_BACKUPS_DIR, 'seasonpass_restore_panthers_2025.json');
  let code = null;
  let json = null;
  try { code = fs.readFileSync(codePath, 'utf8').trim(); } catch (e) { /* no code */ }
  try { json = fs.readFileSync(restoreJsonPath, 'utf8'); } catch (e) { /* no json */ }
  return { code, json };
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[&<>"'`]/g, function (c) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    })[c];
  });
}

const clients = [];

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // SSE endpoint
  if (url === '/events') {
    sendSSEHeaders(res);
    const id = Date.now();
    clients.push(res);
    // send initial payload
    const data = readBackupData();
    res.write(`event: update\ndata: ${JSON.stringify(data)}\n\n`);

    req.on('close', () => {
      const idx = clients.indexOf(res);
      if (idx >= 0) clients.splice(idx, 1);
    });
    return;
  }

  // Serve backups files under /backups/
  if (url.startsWith('/backups/')) {
    const filePath = path.join(WATCH_BACKUPS_DIR, url.replace('/backups/', ''));
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      const ct = ext === '.png' ? 'image/png' : ext === '.json' ? 'application/json' : 'text/plain';
      res.writeHead(200, { 'Content-Type': ct });
      res.end(data);
    });
    return;
  }

  // Accept programmatic pushes to update the backups (dev convenience)
  if (url === '/push' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (payload.code) {
          try { fs.writeFileSync(path.join(WATCH_BACKUPS_DIR, 'latest_recovery_code.txt'), payload.code, 'utf8'); } catch (e) { console.warn('write code failed', e); }
        }
        if (payload.json) {
          try { fs.writeFileSync(path.join(WATCH_BACKUPS_DIR, 'seasonpass_restore_panthers_2025.json'), payload.json, 'utf8'); } catch (e) { console.warn('write json failed', e); }
        }
        broadcastUpdate();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end('bad payload');
      }
    });
    return;
  }

  // Simple restore page to present the code in a mobile-friendly way and
  // attempt to open the app via deep link (rork://restore?code=...)
  if (url.startsWith('/restore')) {
    const q = url.split('?')[1] || '';
    const params = new URLSearchParams(q);
    const code = params.get('code') || '';
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial;margin:20px;text-align:center;-webkit-text-size-adjust:100%}button{padding:12px 18px;font-size:16px;border-radius:8px}code{display:block;white-space:break-spaces;margin-top:12px;background:#f6f8fa;padding:12px;border-radius:8px;color:#111;max-height:240px;overflow:auto}</style></head><body><h3>Open in Rork</h3><p>Tap the button to open the Rork app and restore the code.</p><p><button id="open">Open Rork</button></p><p>If the app is not installed, copy the code below and paste into Settings → Restore from Code.</p><code id="code">${escapeHtml(code)}</code><script>function openDeep(){var url='rork-app://restore?code='+encodeURIComponent(${JSON.stringify(code)});window.location.href=url;}document.getElementById('open').addEventListener('click',openDeep);setTimeout(openDeep,500);</script></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // Serve static files from this folder
  let f = url === '/' ? '/index.html' : url;
  const staticPath = path.join(__dirname, f);
  fs.readFile(staticPath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(staticPath).toLowerCase();
    const ct = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : 'text/plain';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  });
});

function broadcastUpdate() {
  const payload = JSON.stringify(readBackupData());
  clients.forEach((c) => {
    try {
      c.write(`event: update\ndata: ${payload}\n\n`);
    } catch (e) { /* ignore */ }
  });
}

// Watch the backups dir for changes
try {
  fs.mkdirSync(WATCH_BACKUPS_DIR, { recursive: true });
  fs.watch(WATCH_BACKUPS_DIR, { persistent: true }, (ev, fn) => {
    console.log('[watcher] change', ev, fn);
    broadcastUpdate();
  });
} catch (e) {
  console.warn('[watcher] failed to watch backups directory', e);
}

server.listen(PORT, () => {
  console.log(`[watcher] Server listening on http://localhost:${PORT}`);
  console.log(`[watcher] Backups dir: ${WATCH_BACKUPS_DIR}`);
});
