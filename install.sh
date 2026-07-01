#!/usr/bin/env bash
# Convenience wrapper — delegates to the Claude Code adapter installer.
#
# For other adapters, run them directly:
#   ./adapters/cursor/install.sh
#   ./adapters/<tool>/install.sh
#
# Usage:
#   ./install.sh                # install for Claude Code (default)
#   ./install.sh --copy         # copy instead of symlink
#   ./install.sh --uninstall    # remove Claude Code install
#
# Run from anywhere.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/adapters/claude-code/install.sh" "$@"
