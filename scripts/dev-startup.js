#!/usr/bin/env node
/**
 * Smart dev startup script that:
 * 1. Checks if servers are already running
 * 2. Kills old processes if needed
 * 3. Starts both Expo and API servers
 * 4. Monitors their health
 * 
 * Run: npm run dev
 */

const { spawn, execSync } = require('child_process');
const http = require('http');

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

function killPort(port) {
  try {
    console.log(`🔪 Killing processes on port ${port}...`);
    execSync(`lsof -tiTCP:${port} -sTCP:LISTEN | xargs kill -9`, { 
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

async function killExpoAndAPI() {
  console.log('🧹 Cleaning up old processes...');
  
  // Kill common Expo/Metro ports
  for (const port of [EXPO_PORT, 8082, 8083, 8084, API_PORT]) {
    killPort(port);
  }
  
  // Wait a bit for processes to die
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('✅ Cleanup complete\n');
}

function startAPI() {
  console.log('🚀 Starting API server...');
  
  const api = spawn('bun', ['./backend/server.ts'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      SPM_SYNC_STORE_PATH: './dev/sync-store.json',
      PORT: String(API_PORT)
    }
  });

  api.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => console.log(`  [API] ${line}`));
  });

  api.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => console.error(`  [API ERROR] ${line}`));
  });

  api.on('exit', (code) => {
    console.error(`❌ API server exited with code ${code}`);
    process.exit(1);
  });

  return api;
}

function startExpo() {
  console.log('🚀 Starting Expo server...\n');
  
  const expo = spawn('npx', ['expo', 'start', '--web', '--clear', '--lan'], {
    stdio: 'inherit'
  });

  expo.on('exit', (code) => {
    console.error(`❌ Expo server exited with code ${code}`);
    process.exit(1);
  });

  return expo;
}

function startGitWatcher() {
  console.log('🔄 Starting git auto-sync...');
  
  const watcher = spawn('node', ['./scripts/git-auto-sync.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  watcher.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => console.log(`  [GIT] ${line}`));
  });

  watcher.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => console.error(`  [GIT ERROR] ${line}`));
  });

  watcher.on('exit', (code) => {
    if (code !== 0) {
      console.log(`⚠️  Git watcher exited with code ${code}`);
    }
  });

  return watcher;
}

async function waitForServer(port, name, maxAttempts = 30) {
  console.log(`⏳ Waiting for ${name} to be ready...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkPort(port)) {
      console.log(`✅ ${name} is ready!\n`);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error(`❌ ${name} failed to start after ${maxAttempts} seconds`);
  return false;
}

asyncStart git watcher (background)
  const gitWatcher = startGitWatcher();

  // Then start Expo (slower startup)
  const expo = startExpo();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down servers...');
    api.kill('SIGTERM');
    expo.kill('SIGTERM');
    gitWatcher.kill('SIGTERM');
    
    setTimeout(() => {
      api.kill('SIGKILL');
      expo.kill('SIGKILL');
      gitWatcherRunning && apiRunning) {
    console.log('✅ Both servers are already running!\n');
    console.log('🌐 Access:');
    console.log(`   Web:  http://localhost:${EXPO_PORT}`);
    console.log(`   API:  http://localhost:${API_PORT}\n`);
    console.log('💡 To restart: npm run dev:restart');
    return;
  }

  // Clean up any old processes
  await killExpoAndAPI();

  // Start API first (faster startup)
  const api = startAPI();
  await waitForServer(API_PORT, 'API', 10);

  // Then start Expo (slower startup)
  const expo = startExpo();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down servers...');
    api.kill('SIGTERM');
    expo.kill('SIGTERM');
    
    setTimeout(() => {
      api.kill('SIGKILL');
      expo.kill('SIGKILL');
      process.exit(0);
    }, 3000);
  });
}

main().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
