#!/bin/bash
# ==============================================================================
# Termux Code - All-in-One Launcher
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8088}"
HOST="${HOST:-0.0.0.0}"

echo "======================================================"
echo "  🚀 Termux Code - IDE & Terminal for Agent CLIs"
echo "======================================================"

# Check Python environment
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Installing..."
    pkg install python -y
fi

# Check required python packages
python3 -c "import fastapi, uvicorn, pydantic" 2>/dev/null || {
    echo "[*] Installing required python libraries..."
    pip install fastapi uvicorn pydantic
}

# Export environment variables for the server
export PORT="$PORT"
export HOST="$HOST"
export PYTHONPATH="$DIR"

echo "[*] Starting Termux Code Server..."
echo ""
echo "📱 Open in browser / Webview:"
echo "   👉 http://localhost:$PORT"
echo "   👉 http://127.0.0.1:$PORT"
echo ""
echo "Press Ctrl+C to stop the server."
echo "------------------------------------------------------"

# Automatically open browser if termux-open-url is available
if command -v termux-open-url &> /dev/null; then
    (sleep 1 && termux-open-url "http://localhost:$PORT") &
fi

exec python3 -m server.main
