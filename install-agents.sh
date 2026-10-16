#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# Termux Code - AI Agent CLI Installer Script
# Automated installer for Antigravity CLI, Claude Code, and OpenCode
# ==============================================================================

set -e

# ANSI Color codes
BOLD="\033[1m"
GREEN="\033[1;32m"
BLUE="\033[1;34m"
YELLOW="\033[1;33m"
CYAN="\033[1;36m"
RED="\033[1;31m"
RESET="\033[0m"

PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
HOME_DIR="${HOME:-/data/data/com.termux/files/home}"
BASHRC="$HOME_DIR/.bashrc"

print_banner() {
    clear 2>/dev/null || true
    echo -e "${CYAN}================================================================${RESET}"
    echo -e "${BOLD}${BLUE}  🚀 Termux Code - AI Agent CLI Installer${RESET}"
    echo -e "  ${YELLOW}by @0xposa${RESET} (${CYAN}https://twitter.com/0xposa${RESET})"
    echo -e "${CYAN}================================================================${RESET}"
    echo -e "Pasang dan kelola AI Agent CLI terpopuler langsung di Termux:"
    echo -e " • ${BOLD}Antigravity CLI${RESET} (agy / Google Antigravity Agent)"
    echo -e " • ${BOLD}Claude Code${RESET}     (claude / Anthropic CLI Agent)"
    echo -e " • ${BOLD}OpenCode${RESET}        (opencode / Open-source Coding Agent)"
    echo -e "${CYAN}----------------------------------------------------------------${RESET}"
}

ensure_prerequisites() {
    echo -e "\n${BLUE}[*] Memeriksa paket dasar Termux...${RESET}"
    local missing=()
    for pkg in curl git nodejs python; do
        if ! command -v "$pkg" >/dev/null 2>&1; then
            missing+=("$pkg")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${YELLOW}[!] Memasang paket yang dibutuhkan: ${missing[*]}...${RESET}"
        if command -v pkg >/dev/null 2>&1; then
            pkg update -y && pkg install -y "${missing[@]}"
        elif command -v apt-get >/dev/null 2>&1; then
            apt-get update -y && apt-get install -y "${missing[@]}"
        fi
    else
        echo -e "${GREEN}[✓] Seluruh dependensi dasar sudah terpasang.${RESET}"
    fi
}

update_bashrc_path() {
    local target_path="$1"
    if [ ! -f "$BASHRC" ]; then
        touch "$BASHRC"
    fi
    if ! grep -q "$target_path" "$BASHRC" 2>/dev/null; then
        echo -e "\n# Added by Termux Code Agent Installer" >> "$BASHRC"
        echo "export PATH=\"\$PATH:$target_path\"" >> "$BASHRC"
        echo -e "${GREEN}[✓] Menambahkan $target_path ke PATH di ~/.bashrc${RESET}"
    fi
}

install_antigravity() {
    echo -e "\n${CYAN}==================================================${RESET}"
    echo -e "${BOLD}1. Memasang Antigravity CLI (agy / antigravity-cli)...${RESET}"
    echo -e "${CYAN}==================================================${RESET}"
    
    if command -v agy >/dev/null 2>&1 || command -v antigravity-cli >/dev/null 2>&1; then
        echo -e "${YELLOW}[i] Antigravity CLI sudah terpasang:${RESET}"
        command -v agy 2>/dev/null || command -v antigravity-cli 2>/dev/null
    else
        echo -e "${BLUE}[*] Mengunduh dan memasang Antigravity CLI...${RESET}"
        
        # Priority 1: Official installer script
        if curl -fsSL https://antigravity.google/cli/install.sh 2>/dev/null | bash; then
            echo -e "${GREEN}[✓] Antigravity CLI berhasil dipasang via install script!${RESET}"
        # Priority 2: NPM Global Package
        elif command -v npm >/dev/null 2>&1 && npm install -g @google/antigravity-cli; then
            echo -e "${GREEN}[✓] Antigravity CLI berhasil dipasang via npm!${RESET}"
        else
            echo -e "${RED}[!] Gagal memasang Antigravity CLI secara otomatis.${RESET}"
            echo -e "Silakan coba pasang manual dengan: ${YELLOW}npm install -g @google/antigravity-cli${RESET}"
            return 1
        fi
    fi

    # Ensure symlink between 'agy' and 'antigravity-cli'
    if command -v agy >/dev/null 2>&1 && ! command -v antigravity-cli >/dev/null 2>&1; then
        ln -sf "$(command -v agy)" "$PREFIX/bin/antigravity-cli" 2>/dev/null || true
    elif command -v antigravity-cli >/dev/null 2>&1 && ! command -v agy >/dev/null 2>&1; then
        ln -sf "$(command -v antigravity-cli)" "$PREFIX/bin/agy" 2>/dev/null || true
    fi

    echo -e "${GREEN}[✓] Antigravity CLI siap digunakan dengan perintah:${RESET} ${BOLD}agy${RESET} atau ${BOLD}antigravity-cli${RESET}"
}

install_claude() {
    echo -e "\n${CYAN}==================================================${RESET}"
    echo -e "${BOLD}2. Memasang Claude Code (claude)...${RESET}"
    echo -e "${CYAN}==================================================${RESET}"

    if command -v claude >/dev/null 2>&1; then
        echo -e "${YELLOW}[i] Claude Code sudah terpasang di:${RESET} $(command -v claude)"
    else
        echo -e "${BLUE}[*] Memasang Claude Code via Anthropic official installer / npm...${RESET}"
        
        # Priority 1: Official curl install script
        if curl -fsSL https://claude.ai/install.sh 2>/dev/null | bash; then
            echo -e "${GREEN}[✓] Claude Code berhasil dipasang via official script!${RESET}"
            update_bashrc_path "$HOME_DIR/.local/bin"
        # Priority 2: npm global install
        elif command -v npm >/dev/null 2>&1 && npm install -g @anthropics/claude-code; then
            echo -e "${GREEN}[✓] Claude Code berhasil dipasang via npm!${RESET}"
        else
            echo -e "${RED}[!] Gagal memasang Claude Code secara otomatis.${RESET}"
            echo -e "Silakan coba pasang manual dengan: ${YELLOW}npm install -g @anthropics/claude-code${RESET}"
            return 1
        fi
    fi

    echo -e "${GREEN}[✓] Claude Code siap digunakan dengan perintah:${RESET} ${BOLD}claude${RESET}"
    echo -e "${YELLOW}[Tip] Jalankan 'claude' di terminal lalu ikuti instruksi login akun Anthropic Anda.${RESET}"
}

install_opencode() {
    echo -e "\n${CYAN}==================================================${RESET}"
    echo -e "${BOLD}3. Memasang OpenCode (opencode)...${RESET}"
    echo -e "${CYAN}==================================================${RESET}"

    if command -v opencode >/dev/null 2>&1 || [ -f "$HOME_DIR/.opencode/bin/opencode" ]; then
        echo -e "${YELLOW}[i] OpenCode sudah terpasang.${RESET}"
        update_bashrc_path "$HOME_DIR/.opencode/bin"
    else
        echo -e "${BLUE}[*] Mengunduh dan memasang OpenCode...${RESET}"
        
        # Priority 1: Official installer script
        if curl -fsSL https://opencode.ai/install.sh 2>/dev/null | bash; then
            echo -e "${GREEN}[✓] OpenCode berhasil dipasang via official script!${RESET}"
            update_bashrc_path "$HOME_DIR/.opencode/bin"
        # Priority 2: NPM Package
        elif command -v npm >/dev/null 2>&1 && npm install -g opencode-ai; then
            echo -e "${GREEN}[✓] OpenCode berhasil dipasang via npm!${RESET}"
        else
            echo -e "${RED}[!] Gagal memasang OpenCode secara otomatis.${RESET}"
            echo -e "Silakan kunjungi: ${YELLOW}https://opencode.ai${RESET}"
            return 1
        fi
    fi

    echo -e "${GREEN}[✓] OpenCode siap digunakan dengan perintah:${RESET} ${BOLD}opencode${RESET}"
}

check_status() {
    echo -e "\n${CYAN}==================================================${RESET}"
    echo -e "${BOLD}  📊 Status AI Agent CLI di Termux${RESET}"
    echo -e "${CYAN}==================================================${RESET}"

    local agents=("agy" "antigravity-cli" "claude" "opencode" "aider" "git")

    for agent in "${agents[@]}"; do
        local bin_path
        bin_path=$(command -v "$agent" 2>/dev/null || true)
        if [ -z "$bin_path" ] && [ "$agent" = "opencode" ] && [ -f "$HOME_DIR/.opencode/bin/opencode" ]; then
            bin_path="$HOME_DIR/.opencode/bin/opencode"
        fi

        if [ -n "$bin_path" ]; then
            local ver
            ver=$("$bin_path" --version 2>/dev/null | head -n 1 || echo "installed")
            echo -e " ${GREEN}[TERPASANG]${RESET} ${BOLD}${agent}${RESET} -> $bin_path ($ver)"
        else
            echo -e " ${RED}[BELUM ADA]${RESET} ${agent}"
        fi
    done
    echo -e "${CYAN}--------------------------------------------------${RESET}"
}

interactive_menu() {
    while true; do
        print_banner
        echo -e "Pilih opsi instalasi AI Agent:"
        echo -e "  ${BOLD}[1]${RESET} Pasang ${GREEN}Antigravity CLI${RESET} (Google Antigravity / agy)"
        echo -e "  ${BOLD}[2]${RESET} Pasang ${BLUE}Claude Code${RESET} (Anthropic CLI Agent)"
        echo -e "  ${BOLD}[3]${RESET} Pasang ${YELLOW}OpenCode${RESET} (Open Source Coding Agent)"
        echo -e "  ${BOLD}[4]${RESET} ${BOLD}Pasang SEMUA Agent${RESET} (Antigravity + Claude + OpenCode)"
        echo -e "  ${BOLD}[5]${RESET} Cek Status Agent yang Terpasang"
        echo -e "  ${BOLD}[0]${RESET} Keluar"
        echo -ne "\nMasukkan pilihan [0-5]: "
        read -r choice

        case "$choice" in
            1)
                ensure_prerequisites
                install_antigravity
                ;;
            2)
                ensure_prerequisites
                install_claude
                ;;
            3)
                ensure_prerequisites
                install_opencode
                ;;
            4)
                ensure_prerequisites
                install_antigravity
                install_claude
                install_opencode
                ;;
            5)
                check_status
                ;;
            0)
                echo -e "\n${GREEN}Terima kasih! Selesai.${RESET}"
                exit 0
                ;;
            *)
                echo -e "\n${RED}Pilihan tidak valid.${RESET}"
                ;;
        esac
        echo -ne "\nTekan [Enter] untuk kembali ke menu..."
        read -r
    done
}

# --- Command-line arguments handler ---
case "${1:-}" in
    1|--antigravity|antigravity|agy)
        ensure_prerequisites
        install_antigravity
        ;;
    2|--claude|claude)
        ensure_prerequisites
        install_claude
        ;;
    3|--opencode|opencode)
        ensure_prerequisites
        install_opencode
        ;;
    4|--all|all)
        ensure_prerequisites
        install_antigravity
        install_claude
        install_opencode
        ;;
    5|--status|status)
        check_status
        ;;
    --help|-h)
        echo "Usage: ./install-agents.sh [antigravity | claude | opencode | all | status]"
        ;;
    "")
        interactive_menu
        ;;
    *)
        echo "Opsi tidak dikenal: $1"
        echo "Gunakan: ./install-agents.sh [antigravity | claude | opencode | all | status]"
        exit 1
        ;;
esac
