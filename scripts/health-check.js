#!/usr/bin/env node
/**
 * Quick health check for both Expo and API servers.
 * Run: npm run dev:check
 */

const http = require('http');
const { execSync } = require('child_process');

const EXPO_PORT = 8081;
const API_PORT = 8787;

function checkPort(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
      resolve({ port, name, status: 'running', statusCode: res.statusCode });
    });

    req.on('error', () => {
      resolve({ port, name, status: 'down', error: 'Connection refused' });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ port, name, status: 'timeout', error: 'Request timeout' });
    });
  });
}

async function checkProcesses() {
  const results = [];
  
  // Check if any process is listening on the ports
  for (const [port, name] of [[EXPO_PORT, 'Expo'], [API_PORT, 'API']]) {
    try {
      const output = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] 
      });
      results.push({ port, name, hasListener: true, pid: output.split('\n')[1]?.split(/\s+/)[1] });
    } catch {
      results.push({ port, name, hasListener: false });
    }
  }
  
  return results;
}

async function main() {
  console.log('🔍 Checking development server health...\n');

  const [expoHealth, apiHealth] = await Promise.all([
    checkPort(EXPO_PORT, 'Expo'),
    checkPort(API_PORT, 'API')
  ]);

  const processes = await checkProcesses();

  // Display results
  console.log('📊 Server Status:');
  console.log('─'.repeat(50));

  for (const service of [expoHealth, apiHealth]) {
    const icon = service.status === 'running' ? '✅' : '❌';
    const process = processes.find(p => p.port === service.port);
    
    console.log(`${icon} ${service.name} (port ${service.port}): ${service.status.toUpperCase()}`);
    
    if (service.status === 'running') {
      console.log(`   HTTP Status: ${service.statusCode}`);
      if (process?.pid) {
        console.log(`   PID: ${process.pid}`);
      }
    } else if (process?.hasListener) {
      console.log(`   Warning: Port has listener but not responding`);
      console.log(`   PID: ${process.pid}`);
    } else {
      console.log(`   Error: ${service.error || 'Not running'}`);
    }
    console.log('');
  }

  console.log('─'.repeat(50));

  const allRunning = expoHealth.status === 'running' && apiHealth.status === 'running';
  
  if (allRunning) {
    console.log('✅ All services are healthy!\n');
    console.log('🌐 Access:');
    console.log(`   Web:  http://localhost:${EXPO_PORT}`);
    console.log(`   API:  http://localhost:${API_PORT}`);
    process.exit(0);
  } else {
    console.log('❌ Some services are down!\n');
    console.log('💡 To fix:');
    console.log('   Run: npm run dev:restart');
    console.log('   Or:  npm run dev');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Health check failed:', err);
  process.exit(1);
});
