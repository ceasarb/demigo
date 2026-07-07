#!/usr/bin/env bash
# Install Tandem prompts as Claude Code slash commands under /tandem:*
#
# The markdown prompts in tandem/prompts/ become callable as
# /tandem:scaffold, /tandem:brainstorm, /tandem:study, etc. inside Claude Code.
#
# It also stages the shared curriculum renderer (renderer/) at
# ~/.claude/commands/tandem/_assets/ so /tandem:learn and /tandem:teach can seed
# it into your concept library and render study layers to HTML by default.
#
# Usage:
#   ./install.sh                # default: symlink mode (recommended)
#   ./install.sh --copy         # copy mode (for stable installations)
#   ./install.sh --uninstall    # remove the tandem namespace directory
#
# Run from anywhere — the script resolves its own location.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CLAUDE_DIR="${HOME}/.claude"
NAMESPACE="tandem"
TARGET_DIR="${CLAUDE_DIR}/commands/${NAMESPACE}"
SRC_DIR="${REPO_ROOT}/prompts"
RENDERER_SRC="${REPO_ROOT}/renderer"
RENDERER_DST="${TARGET_DIR}/_assets"
MODE="${1:-symlink}"

# Handle uninstall
if [[ "${MODE}" == "--uninstall" ]] || [[ "${MODE}" == "uninstall" ]]; then
  if [[ -d "${TARGET_DIR}" ]] || [[ -L "${TARGET_DIR}" ]]; then
    echo "🗑️  Removing ${TARGET_DIR}"
    rm -rf "${TARGET_DIR}"
    echo "✅ Uninstalled. Other commands in ~/.claude/ are untouched."
  else
    echo "ℹ️  Nothing to uninstall — ${TARGET_DIR} doesn't exist."
  fi
  exit 0
fi

echo "🔧 Installing Tandem for Claude Code"
echo "   Source:    ${SRC_DIR}"
echo "   Target:    ${TARGET_DIR}"
echo "   Namespace: /${NAMESPACE}:<command>"
echo "   Mode:      ${MODE}"
echo

if [[ ! -d "${SRC_DIR}" ]]; then
  echo "❌ Source directory not found: ${SRC_DIR}"
  echo "   Expected layout: <repo-root>/prompts/*.md"
  exit 1
fi

shopt -s nullglob
SRC_CMDS=("${SRC_DIR}"/*.md)
shopt -u nullglob

if [[ ${#SRC_CMDS[@]} -eq 0 ]]; then
  echo "❌ No .md files found in ${SRC_DIR}. Nothing to install."
  exit 1
fi

mkdir -p "${TARGET_DIR}"

echo "📦 Installing ${#SRC_CMDS[@]} command(s)..."
INSTALLED=0
SKIPPED=0

for cmd in "${SRC_CMDS[@]}"; do
  basename="$(basename "$cmd")"
  target="${TARGET_DIR}/${basename}"

  if [[ -e "${target}" ]] || [[ -L "${target}" ]]; then
    echo "   ⚠️  ${basename} already exists, skipping"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "${MODE}" == "--copy" ]] || [[ "${MODE}" == "copy" ]]; then
    cp "${cmd}" "${target}"
    echo "   ✓ Copied  ${basename}"
  elif [[ "${MODE}" == "symlink" ]] || [[ "${MODE}" == "--symlink" ]]; then
    ln -s "${cmd}" "${target}"
    echo "   ✓ Linked  ${basename}"
  else
    echo "❌ Unknown mode: ${MODE}"
    echo "   Use one of: (default) | --copy | --uninstall"
    exit 1
  fi
  INSTALLED=$((INSTALLED + 1))
done

# Stage the shared curriculum renderer so /tandem:learn and /tandem:teach can
# seed <library>/study/_assets/ from a stable, clone-location-independent path.
if [[ -d "${RENDERER_SRC}" ]]; then
  echo
  echo "🎨 Staging curriculum renderer → ${RENDERER_DST}"
  # Refresh in place: the renderer is generated output, safe to overwrite.
  rm -rf "${RENDERER_DST}"
  if [[ "${MODE}" == "--copy" ]] || [[ "${MODE}" == "copy" ]]; then
    cp -R "${RENDERER_SRC}" "${RENDERER_DST}"
    echo "   ✓ Copied  renderer/ (build.mjs, template.html, style.css)"
  else
    ln -s "${RENDERER_SRC}" "${RENDERER_DST}"
    echo "   ✓ Linked  renderer/ (build.mjs, template.html, style.css)"
  fi
else
  echo
  echo "⚠️  No renderer/ dir at ${RENDERER_SRC} — HTML rendering of study layers will be unavailable."
fi

echo
echo "✅ Done. Installed ${INSTALLED}, skipped ${SKIPPED}."
echo
echo "Invoke commands with the tandem namespace, e.g.:"
echo "   /${NAMESPACE}:scaffold      — scaffold Tandem structure in current project"
echo "   /${NAMESPACE}:brainstorm    — start a decision-capture conversation"
echo "   /${NAMESPACE}:discovery     — ingest client material into decisions"
echo "   /${NAMESPACE}:learn         — learn a topic in depth (cross-project)"
echo
echo "First-time use:"
echo "   1. cd into the project where you want to use Tandem"
echo "   2. Open (or restart) Claude Code in that directory"
echo "   3. Run /${NAMESPACE}:scaffold to create .claude/docs/{decisions,views,retros,discovery,design-refs}/"
echo "   4. Run /${NAMESPACE}:brainstorm to start capturing decisions"
echo
echo "Concept library: ~/Developer/concepts/ by default."
echo "Override with: export TANDEM_CONCEPTS_DIR=/your/preferred/path"
echo
echo "Study layers render to HTML by default via the staged renderer."
echo "That requires 'pandoc' and 'node' on PATH:  brew install pandoc node"
echo
echo "To uninstall later: ${SCRIPT_DIR}/install.sh --uninstall"
