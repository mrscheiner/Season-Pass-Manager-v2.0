# Development Survival Guide

## 🚨 When Nothing Works

**Symptom:** App won't load, servers seem down, "nothing works"

**Quick Fix:**
```bash
npm run dev:restart
```

That's it. This will kill any stuck processes and restart everything cleanly.

---

## 📊 Health Checks

### Quick Status Check
```bash
npm run dev:status
```
Shows which services are up/down with PIDs.

### Detailed Health Check
```bash
npm run dev:check
```
Full diagnostic with HTTP checks and recommendations.

---

## 🚀 Starting Development

### Option 1: Smart Startup (Recommended)
```bash
npm run dev
```
- Checks if already running (won't start duplicates)
- Kills old processes if needed
- Starts both API and Expo
- **Starts git auto-sync** (automatically commits & pushes changes)
- Monitors health during startup

### Option 2: VS Code
Press `F5` or go to Run & Debug → "🏒 Dev: Start Everything"

### Option 3: Manual (If scripts fail)
```bash
# Terminal 1: API
bun ./backend/server.ts

# Terminal 2: Expo
npx expo start --web --clear --lan
```

---

## 🔧 Common Issues

### Issue: Port already in use
```bash
# Kill specific port
lsof -tiTCP:8081 -sTCP:LISTEN | xargs kill -9

# Or restart everything
npm run dev:restart
```

### Issue: Metro bundler stuck
```bash
# Clear cache and restart
npx expo start --clear
```

### Issue: API not responding
```bash
# Check if API is running
curl http://localhost:8787/

# Restart just the API
bun ./backend/server.ts
```

### Issue: iPhone can't connect
1. Make sure you're on the same WiFi
2. Check the LAN IP in terminal output (e.g., `10.0.0.196`)
3. Scan the QR code with Expo Go
4. If that fails, try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

---

## 📱 Access Points

Once everything is running:

- **Web:** http://localhost:8081
- **iPhone (LAN):** exp://YOUR_IP:8081 (scan QR code)
- **iPhone (Tunnel):** exp://xxx.exp.direct (when using --tunnel)
- **API:** http://localhost:8787
- **API Health:** http://localhost:8787/

---

## 🎯 Daily Workflow

### Morning Startup
```bash
npm run dev:status     # Check if anything is still running from yesterday
npm run dev            # Start if needed
```

### Before Major Changes
```bash
npm run dev:check      # Verify everything is healthy
# Make your changes
npm run dev:restart    # Restart to pick up changes
```

### End of Day
Just close the terminal or press `Ctrl+C`. The servers will stop.

Optionally:
```bash
# Kill everything explicitly
lsof -tiTCP:8081,8787 -sTCP:LISTEN | xargs kill -9
```

---

## 🛡️ Prevention Tips

1. **Always use `npm run dev`** instead of manually starting servers
2. **Run `npm run dev:status`** before reporting issues
3. **Use `npm run dev:restart`** after making backend changes
4. **Don't start multiple instances** - the script prevents this
5. **Close terminals properly** with `Ctrl+C` instead of force-quitting

---

## 🆘 Nuclear Option

If nothing else works:

```bash
# Kill ALL node/bun/expo processes
pkill -9 node
pkill -9 bun
pkill -9 expo

# Clear Metro cache
rm -rf node_modules/.cache

# Restart
npm run dev
```

---
� Git Auto-Sync

When you run `npm run dev`, git auto-sync starts automatically:
- ✅ Watches for file changes
- ✅ Auto-commits every 5 seconds after you stop editing
- ✅ Auto-pushes to GitHub
- ✅ Keeps Rork and GitHub in sync

### Manual Git Commands

```bash
# Start auto-sync separately (if not using npm run dev)
npm run git:watch

# Manual commit and push
npm run git:sync

# Traditional git
git add .
git commit -m "your message"
git push
```

---

## �
## 📞 Debug Commands

```bash
# See what's listening on ports
lsof -nP -iTCP -sTCP:LISTEN | grep -E '8081|8787'

# See all Expo/Metro processes
ps aux | grep -E 'expo|metro|node'

# Check API health
curl -i http://localhost:8787/

# Check Expo status
curl -I http://localhost:8081/
```

---

## 🔔 Monitoring (Optional)

Want to be notified when servers go down?

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
alias spm-check='cd /Users/joshscheiner/Season-Pass-Manager-v2.0 && npm run dev:status'
alias spm-dev='cd /Users/joshscheiner/Season-Pass-Manager-v2.0 && npm run dev'
alias spm-restart='cd /Users/joshscheiner/Season-Pass-Manager-v2.0 && npm run dev:restart'
```

Then from anywhere:
```bash
spm-check      # Quick status
spm-dev        # Start servers
spm-restart    # Restart everything
```
