#!/bin/bash

# MusicSheet Launcher
# Starts the app on port 3847 and opens it in your default browser

PORT=3847
URL="http://localhost:$PORT"

echo "🎵 Starting MusicSheet on port $PORT..."

# Function to open browser based on OS
open_browser() {
  sleep 2
  case "$(uname -s)" in
    Darwin*)  
      # macOS - try to open in fullscreen
      osascript -e "tell application \"Google Chrome\" to open location \"$URL\"" 2>/dev/null || \
      osascript -e "tell application \"Safari\" to open location \"$URL\"" 2>/dev/null || \
      open "$URL"
      ;;
    Linux*)   
      xdg-open "$URL" 2>/dev/null
      ;;
    MINGW*|MSYS*|CYGWIN*)  
      start "$URL"
      ;;
    *)        
      echo "Please open $URL in your browser"
      ;;
  esac
}

# Open browser in background
open_browser &

# Start Next.js dev server
PORT=$PORT npm run dev
