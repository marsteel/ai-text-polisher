#!/bin/bash

# Build script for AI Text Polisher Chrome Extension
# This script creates a zip file for Chrome Web Store submission
# Filename includes version, branch name, and commit hash

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building AI Text Polisher extension...${NC}"

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "${BLUE}Version: ${VERSION}${NC}"

# Get git branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}Branch: ${BRANCH}${NC}"

# Get short commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${BLUE}Commit: ${COMMIT_HASH}${NC}"

# Create output filename with version, branch, and commit hash
OUTPUT_FILE="ai-text-polisher-v${VERSION}-${BRANCH}-${COMMIT_HASH}.zip"

# Remove old zip files with same version
echo "Removing old zip files for version ${VERSION}..."
rm -f ai-text-polisher-v${VERSION}-*.zip 2>/dev/null || true

# Create zip file with extension files
echo -e "${BLUE}Creating zip file...${NC}"

zip -r "$OUTPUT_FILE" \
    manifest.json \
    background.js \
    popup.html \
    popup.js \
    popup.css \
    options.html \
    options.js \
    options.css \
    ai-client.js \
    storage.js \
    notifications.js \
    _locales/ \
    icons/ \
    -x "*.DS_Store" \
    -x "__MACOSX/*" \
    -x "*.git*"

echo -e "${GREEN}✓ Build complete!${NC}"
echo -e "${GREEN}Output: ${OUTPUT_FILE}${NC}"
echo -e "${BLUE}File size: $(du -h "$OUTPUT_FILE" | cut -f1)${NC}"

# Make the script show the zip contents
echo -e "\n${BLUE}Package contents:${NC}"
unzip -l "$OUTPUT_FILE"

echo -e "\n${GREEN}Ready for Chrome Web Store submission!${NC}"
