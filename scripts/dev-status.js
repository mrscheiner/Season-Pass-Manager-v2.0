#!/usr/bin/env node
/**
 * Quick status check with helpful suggestions.
 * Run: npm run dev:status
 */

const http = require('http');
const { execSync } = require('child_process');

const EXPO_PORT = 8081;
const API_PORT = 8787;

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 1000 }, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function getProcessInfo(port) {
  try {
    const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    
    const lines = output.trim().split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      return {
        command: parts[0],
        pid: parts[1],
        user: parts[2]
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function main() {
  console.log('\n🏒 Season Pass Manager - Status Check\n');

  const [expoRunning, apiRunning] = await Promise.all([
    checkPort(EXPO_PORT),
    checkPort(API_PORT)
  ]);

  const expoProcess = getProcessInfo(EXPO_PORT);
  const apiProcess = getProcessInfo(API_PORT);

  // Status display
  const expoIcon = expoRunning ? '🟢' : '🔴';
  const apiIcon = apiRunning ? '🟢' : '🔴';

  console.log(`${expoIcon} Expo Server (${EXPO_PORT}): ${expoRunning ? 'RUNNING' : 'DOWN'}`);
  if (expoProcess) {
    console.log(`   PID: ${expoProcess.pid} | Command: ${expoProcess.command}`);
  }
  
  console.log(`${apiIcon} API Server (${API_PORT}): ${apiRunning ? 'RUNNING' : 'DOWN'}`);
  if (apiProcess) {
    console.log(`   PID: ${apiProcess.pid} | Command: ${apiProcess.command}`);
  }

  console.log('');

  // Recommendations
  if (expoRunning && apiRunning) {
    console.log('✅ Everything is running!\n');
    console.log('🌐 Your app is available at:');
    console.log(`   • Web:  http://localhost:${EXPO_PORT}`);
    console.log(`   • API:  http://localhost:${API_PORT}`);
  } else if (!expoRunning && !apiRunning) {
    console.log('❌ Nothing is running!\n');
    console.log('💡 Quick fix:');
    console.log('   npm run dev');
  } else {
    console.log('⚠️  Partial service outage!\n');
    console.log('💡 Recommended action:');
    console.log('   npm run dev:restart');
  }

  console.log('');
  process.exit(expoRunning && apiRunning ? 0 : 1);
}

main().catch(err => {
  console.error('Status check failed:', err);
  process.exit(1);
});
