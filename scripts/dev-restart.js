#!/usr/bin/env node
/**
 * Force restart both servers.
 * Run: npm run dev:restart
 */

const { execSync } = require('child_process');

console.log('🔄 Restarting development servers...\n');

// Kill all relevant processes
console.log('🛑 Stopping existing servers...');
for (const port of [8081, 8082, 8083, 8084, 8787]) {
  try {
    execSync(`lsof -tiTCP:${port} -sTCP:LISTEN | xargs kill -9`, { 
      stdio: 'ignore'
    });
  } catch {
    // Ignore if no process on this port
  }
}

console.log('✅ All processes stopped\n');
console.log('⏳ Waiting 2 seconds...\n');

// Wait a bit
setTimeout(() => {
  console.log('🚀 Starting servers...\n');
  console.log('═'.repeat(50));
  console.log('');
  
  // Now run the startup script
  require('./dev-startup.js');
}, 2000);
