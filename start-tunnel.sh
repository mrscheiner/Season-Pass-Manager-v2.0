#!/bin/bash

cd "$(dirname "$0")"

# Kill any existing Expo processes
lsof -tiTCP:8081,8082,8083,8084 -sTCP:LISTEN | xargs kill -9 2>/dev/null || true

# Start Expo with tunnel in background, capture output
npx expo start --tunnel --clear > /tmp/expo-output.txt 2>&1 &

echo "Starting Expo tunnel..."
echo "Waiting for tunnel URL..."

# Wait and extract the tunnel URL
for i in {1..30}; do
    sleep 1
    URL=$(grep -o "exp://[^[:space:]]*\.exp\.direct" /tmp/expo-output.txt | head -1)
    if [ ! -z "$URL" ]; then
        echo ""
        echo "✅ TUNNEL READY!"
        echo ""
        echo "$URL" > ~/expo-tunnel-url.txt
        echo "URL saved to: ~/expo-tunnel-url.txt"
        echo ""
        
        # Save to JSON for web page
        echo "{\"url\": \"$URL\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > tunnel-status.json
        
        echo "Your URL: $URL"
        echo ""
        echo "Scan this QR code with Expo Go:"
        echo ""
        npx qrcode-terminal "$URL"
        echo ""
        echo "---"
        echo "📱 PHONE SHORTCUT:"
        echo "Open this on your phone and add to home screen:"
        echo "http://10.0.0.196:3000"
        echo ""
        echo "Starting simple web server on port 3000..."
        python3 -m http.server 3000 &
        WEB_PID=$!
        echo "Web server PID: $WEB_PID"
        echo ""
        echo "To stop: run 'pkill -f expo' and 'kill $WEB_PID'"
        break
    fi
done

# Keep showing the output
tail -f /tmp/expo-output.txt
