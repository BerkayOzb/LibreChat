#!/bin/bash

# Rollback Script for Fal.ai Nano Banana Tool
# Date: 2025-11-07
# Description: Safely removes the Nano Banana tool integration from LibreChat

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=================================================="
echo "LibreChat - Nano Banana Tool Rollback"
echo "=================================================="
echo ""
echo "This script will remove the Fal.ai Nano Banana tool from LibreChat."
echo "Project root: $PROJECT_ROOT"
echo ""

# Create backup directory
BACKUP_DIR="$SCRIPT_DIR/backups/nano_banana_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backups in: $BACKUP_DIR"
echo ""

# Function to backup and restore file
backup_and_restore() {
    local file="$1"
    local description="$2"

    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo "Processing: $description"
        cp "$PROJECT_ROOT/$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "  ✓ Backup created"
    else
        echo "  ⚠ File not found: $file (skipping)"
        return 1
    fi
}

# Backup all files
echo "Step 1: Creating backups..."
echo "----------------------------"
backup_and_restore "api/app/clients/tools/structured/FalaiNanoBanana.js" "Tool class"
backup_and_restore "api/app/clients/tools/manifest.json" "Manifest"
backup_and_restore "packages/data-provider/src/config.ts" "Config"
backup_and_restore "api/app/clients/tools/index.js" "Tool index"
backup_and_restore "api/app/clients/tools/util/handleTools.js" "Tool handler"
backup_and_restore ".env.example" "Environment example"
echo ""

echo "Step 2: Removing Nano Banana tool..."
echo "-------------------------------------"

# Remove tool class file
if [ -f "$PROJECT_ROOT/api/app/clients/tools/structured/FalaiNanoBanana.js" ]; then
    rm "$PROJECT_ROOT/api/app/clients/tools/structured/FalaiNanoBanana.js"
    echo "  ✓ Removed FalaiNanoBanana.js"
else
    echo "  ⚠ FalaiNanoBanana.js already removed"
fi

# Restore manifest.json (remove nano-banana entry)
cat > "$PROJECT_ROOT/api/app/clients/tools/manifest.json.tmp" << 'EOF'
This is a placeholder - manual edit required
EOF

echo "  ⚠ manifest.json requires manual editing to remove nano-banana entry"
echo "    File backed up to: $BACKUP_DIR/manifest.json.backup"

# Restore config.ts (remove nano-banana from imageGenTools)
echo "  ⚠ config.ts requires manual editing to remove 'nano-banana' from imageGenTools Set"
echo "    File backed up to: $BACKUP_DIR/config.ts.backup"

# Restore index.js
echo "  ⚠ index.js requires manual editing to remove FalaiNanoBanana import and export"
echo "    File backed up to: $BACKUP_DIR/index.js.backup"

# Restore handleTools.js
echo "  ⚠ handleTools.js requires manual editing to remove FalaiNanoBanana references"
echo "    File backed up to: $BACKUP_DIR/handleTools.js.backup"

# Restore .env.example
echo "  ⚠ .env.example requires manual editing to remove FALAI_API_KEY section"
echo "    File backed up to: $BACKUP_DIR/.env.example.backup"

echo ""
echo "Step 3: Manual rollback instructions"
echo "-------------------------------------"
echo ""
echo "To complete the rollback, manually edit the following files:"
echo ""
echo "1. api/app/clients/tools/manifest.json"
echo "   Remove the nano-banana tool entry (the last entry in the array)"
echo ""
echo "2. packages/data-provider/src/config.ts (line ~1189)"
echo "   Change: export const imageGenTools = new Set(['dalle', 'dall-e', 'stable-diffusion', 'flux', 'nano-banana']);"
echo "   To:     export const imageGenTools = new Set(['dalle', 'dall-e', 'stable-diffusion', 'flux']);"
echo ""
echo "3. api/app/clients/tools/index.js"
echo "   Remove: const FalaiNanoBanana = require('./structured/FalaiNanoBanana');"
echo "   Remove: FalaiNanoBanana, (from module.exports)"
echo ""
echo "4. api/app/clients/tools/util/handleTools.js"
echo "   Remove: FalaiNanoBanana, (from imports)"
echo "   Remove: 'nano-banana': FalaiNanoBanana, (from toolConstructors)"
echo "   Remove: 'nano-banana': imageGenOptions, (from toolOptions)"
echo ""
echo "5. .env.example"
echo "   Remove the Fal.ai Nano Banana section (lines with FALAI_API_KEY)"
echo ""
echo "All backup files are available in: $BACKUP_DIR"
echo ""

# Create detailed rollback instructions file
cat > "$BACKUP_DIR/ROLLBACK_INSTRUCTIONS.md" << 'EOF'
# Nano Banana Tool Rollback Instructions

## Automatic Steps Completed
- ✓ FalaiNanoBanana.js removed
- ✓ All files backed up

## Manual Steps Required

### 1. Edit manifest.json
**File:** `api/app/clients/tools/manifest.json`

Remove the entire nano-banana entry (should be the last item):
```json
  {
    "name": "Fal.ai Nano Banana",
    "pluginKey": "nano-banana",
    "description": "Ultra-fast image generation using Fal.ai's Nano Banana model. Optimized for speed and efficiency.",
    "icon": "https://fal.ai/favicon.ico",
    "isAuthRequired": "true",
    "authConfig": [
      {
        "authField": "FALAI_API_KEY",
        "label": "Fal.ai API Key",
        "description": "Get your Fal.ai API key from <a href=\"https://fal.ai/dashboard/keys\" target=\"_blank\">fal.ai dashboard</a>"
      }
    ]
  }
```

### 2. Edit config.ts
**File:** `packages/data-provider/src/config.ts` (line ~1189)

Change FROM:
```typescript
export const imageGenTools = new Set(['dalle', 'dall-e', 'stable-diffusion', 'flux', 'nano-banana']);
```

Change TO:
```typescript
export const imageGenTools = new Set(['dalle', 'dall-e', 'stable-diffusion', 'flux']);
```

### 3. Edit index.js
**File:** `api/app/clients/tools/index.js`

Remove the import:
```javascript
const FalaiNanoBanana = require('./structured/FalaiNanoBanana');
```

Remove from exports:
```javascript
FalaiNanoBanana,
```

### 4. Edit handleTools.js
**File:** `api/app/clients/tools/util/handleTools.js`

Remove from imports section:
```javascript
FalaiNanoBanana,
```

Remove from toolConstructors object:
```javascript
'nano-banana': FalaiNanoBanana,
```

Remove from toolOptions object:
```javascript
'nano-banana': imageGenOptions,
```

### 5. Edit .env.example
**File:** `.env.example`

Remove the section:
```bash
# Fal.ai Nano Banana
#-----------------
# Get your API key at https://fal.ai/dashboard/keys
# FALAI_API_KEY=
```

## Verification

After completing manual edits, verify rollback:

```bash
# Verify tool class is removed
! test -f api/app/clients/tools/structured/FalaiNanoBanana.js && echo "✓ Tool class removed"

# Verify manifest entry is removed
! grep -q "nano-banana" api/app/clients/tools/manifest.json && echo "✓ Manifest cleaned"

# Verify config.ts update
! grep -q "nano-banana" packages/data-provider/src/config.ts && echo "✓ Config cleaned"

# Verify index.js export removed
! grep -q "FalaiNanoBanana" api/app/clients/tools/index.js && echo "✓ Tool unexported"

# Verify handleTools.js integration removed
! grep -q "FalaiNanoBanana" api/app/clients/tools/util/handleTools.js && echo "✓ Tool unregistered"

# Verify .env.example cleaned
! grep -q "FALAI_API_KEY" .env.example && echo "✓ Environment variable removed"
```

## Restore from Backup

If you need to restore any file:
```bash
cp backups/[timestamp]/[filename].backup [original_location]
```
EOF

echo "Detailed instructions saved to: $BACKUP_DIR/ROLLBACK_INSTRUCTIONS.md"
echo ""
echo "=================================================="
echo "Rollback preparation complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review the manual steps above"
echo "2. Edit the listed files to remove Nano Banana references"
echo "3. Run verification commands to confirm clean rollback"
echo "4. Restart LibreChat application"
echo ""
echo "For detailed instructions, see:"
echo "$BACKUP_DIR/ROLLBACK_INSTRUCTIONS.md"
echo ""
