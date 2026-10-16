#!/bin/bash
# Termux Code APK Build Script
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "📦 Termux Code - APK Builder"
echo "=========================================="

if command -v gradle &> /dev/null; then
    echo "[*] Gradle detected. Building debug APK..."
    gradle assembleDebug --no-daemon
    echo ""
    echo "✅ APK generated at: app/build/outputs/apk/debug/app-debug.apk"
elif [ -f "./gradlew" ]; then
    echo "[*] Using Gradle Wrapper..."
    ./gradlew assembleDebug
    echo ""
    echo "✅ APK generated at: app/build/outputs/apk/debug/app-debug.apk"
else
    echo "ℹ️ Note: To compile the Android APK directly on device or laptop:"
    echo "  1. On PC / Android Studio: Open folder ~/projects/termux-code/android in Android Studio and click 'Build APK'."
    echo "  2. On Termux: Install openjdk-17 and gradle: 'pkg install openjdk-17 gradle -y', then run this script again."
    echo ""
    echo "In the meantime, the IDE is fully usable RIGHT NOW via ./start.sh!"
fi
