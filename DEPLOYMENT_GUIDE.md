# 🚀 Permanent App Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
(Create a free account at expo.dev if you don't have one)

### Step 3: Configure Your Project
```bash
cd /Users/joshscheiner/Season-Pass-Manager-v2.0
eas build:configure
```

### Step 4: Build Your App

**For iPhone (TestFlight - easy, no Apple Developer needed for testing):**
```bash
eas build --profile preview --platform ios
```

**For Android (APK you can install directly):**
```bash
eas build --profile preview --platform android
```

After the build completes (15-20 minutes), you'll get:
- **iOS**: A link to install via TestFlight
- **Android**: A direct download link for the APK

## 📱 Installing on Your Phone

### iPhone:
1. Build will be uploaded to TestFlight automatically
2. Install TestFlight app from App Store
3. Follow the link EAS provides
4. Install your app!

### Android:
1. Download the APK from the link EAS provides
2. Open it on your Android device
3. Allow "Install from Unknown Sources" if prompted
4. Install!

## 🔄 Updating Your App (OTA Updates)

Once installed, you can push instant updates without rebuilding:

```bash
eas update --branch preview --message "Bug fixes"
```

Users will get the update next time they open the app!

## 💡 Your App Info

- **Bundle ID (iOS)**: com.mrscheiner.seasonpassmanager
- **Package (Android)**: com.mrscheiner.seasonpassmanager
- **App Name**: Season Pass Manager

## 📝 Notes

- Free tier includes: Unlimited OTA updates, 30 builds/month
- First build takes ~15-20 minutes
- Subsequent builds are faster (~10 minutes)
- Updates are instant (OTA)

## 🆘 Troubleshooting

If build fails:
```bash
# Clear cache and try again
npm install
eas build --clear-cache --profile preview --platform android
```

## Current Status
✅ EAS configured with preview build profile
✅ Ready to build for iOS and Android
⏳ Next: Run `eas build` command above
