#!/usr/bin/env node
/**
 * Auto-sync git changes to GitHub.
 * Watches for file changes and automatically commits + pushes.
 * 
 * Run: npm run git:watch
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before committing
const CHECK_INTERVAL_MS = 10000; // Check for changes every 10 seconds

let debounceTimer = null;
let isProcessing = false;

function hasGitChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch (error) {
    console.error('❌ Error checking git status:', error.message);
    return false;
  }
}

function getChangeSummary() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const lines = status.trim().split('\n').filter(Boolean);
    
    const changes = {
      modified: [],
      added: [],
      deleted: [],
      renamed: []
    };

    lines.forEach(line => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3);
      
      if (status === 'M' || status === 'MM') changes.modified.push(file);
      else if (status === 'A' || status === '??') changes.added.push(file);
      else if (status === 'D') changes.deleted.push(file);
      else if (status === 'R') changes.renamed.push(file);
      else changes.modified.push(file); // Default to modified
    });

    return changes;
  } catch (error) {
    console.error('❌ Error getting change summary:', error.message);
    return null;
  }
}

function generateCommitMessage(changes) {
  const parts = [];
  
  if (changes.added.length > 0) {
    parts.push(`Add ${changes.added.length} file${changes.added.length === 1 ? '' : 's'}`);
  }
  if (changes.modified.length > 0) {
    parts.push(`Update ${changes.modified.length} file${changes.modified.length === 1 ? '' : 's'}`);
  }
  if (changes.deleted.length > 0) {
    parts.push(`Delete ${changes.deleted.length} file${changes.deleted.length === 1 ? '' : 's'}`);
  }
  if (changes.renamed.length > 0) {
    parts.push(`Rename ${changes.renamed.length} file${changes.renamed.length === 1 ? '' : 's'}`);
  }

  const message = parts.join(', ') || 'Update files';
  const timestamp = new Date().toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  return `${message} (auto-sync ${timestamp})`;
}

function commitAndPush() {
  if (isProcessing) {
    console.log('⏳ Already processing, skipping...');
    return;
  }

  isProcessing = true;
  console.log('\n🔄 Starting git sync...');

  try {
    // Check if there are actually changes
    if (!hasGitChanges()) {
      console.log('✅ No changes to commit');
      isProcessing = false;
      return;
    }

    const changes = getChangeSummary();
    if (!changes) {
      isProcessing = false;
      return;
    }

    const commitMessage = generateCommitMessage(changes);
    
    // Stage all changes
    console.log('📦 Staging changes...');
    execSync('git add -A', { stdio: 'inherit' });

    // Commit
    console.log(`💾 Committing: "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

    // Push
    console.log('⬆️  Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });

    console.log('✅ Successfully synced to GitHub!');
    console.log(`   ${changes.added.length} added, ${changes.modified.length} modified, ${changes.deleted.length} deleted`);
    
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      console.log('✅ No changes to commit');
    } else if (error.message.includes('no changes added to commit')) {
      console.log('✅ No changes to commit');
    } else {
      console.error('❌ Git sync failed:', error.message);
    }
  } finally {
    isProcessing = false;
  }
}

function scheduleCommit() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    commitAndPush();
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

function checkForChanges() {
  if (hasGitChanges() && !debounceTimer && !isProcessing) {
    console.log('📝 Changes detected, scheduling commit...');
    scheduleCommit();
  }
}

async function main() {
  console.log('🏒 Season Pass Manager - Git Auto-Sync\n');
  console.log('═'.repeat(50));
  console.log('Watching for file changes...');
  console.log('Press Ctrl+C to stop\n');

  // Check if git is initialized
  try {
    execSync('git status', { stdio: 'ignore' });
  } catch {
    console.error('❌ Not a git repository. Run: git init');
    process.exit(1);
  }

  // Initial sync of any existing changes
  if (hasGitChanges()) {
    console.log('📝 Found uncommitted changes from before...');
    commitAndPush();
  }

  // Start watching
  setInterval(checkForChanges, CHECK_INTERVAL_MS);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping git auto-sync...');
    
    if (hasGitChanges()) {
      console.log('📝 Final sync before exit...');
      commitAndPush();
    }
    
    console.log('✅ Git auto-sync stopped');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Git auto-sync failed:', err);
  process.exit(1);
});
