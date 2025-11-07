#!/bin/bash

echo "=================================================="
echo "Fal.ai Nano Banana Tool - Verification"
echo "=================================================="
echo ""

# Verify tool class exists
if [ -f "api/app/clients/tools/structured/FalaiNanoBanana.js" ]; then
    echo "✓ Tool class exists (FalaiNanoBanana.js)"
else
    echo "✗ Tool class missing"
fi

# Verify manifest entry
if grep -q "nano-banana" api/app/clients/tools/manifest.json; then
    echo "✓ Manifest entry exists"
else
    echo "✗ Manifest entry missing"
fi

# Verify config.ts update
if grep -q "nano-banana" packages/data-provider/src/config.ts; then
    echo "✓ Config.ts updated (imageGenTools)"
else
    echo "✗ Config.ts not updated"
fi

# Verify index.js export
if grep -q "FalaiNanoBanana" api/app/clients/tools/index.js; then
    echo "✓ Tool exported in index.js"
else
    echo "✗ Tool not exported"
fi

# Verify handleTools.js integration
if grep -q "FalaiNanoBanana" api/app/clients/tools/util/handleTools.js; then
    echo "✓ Tool registered in handleTools.js"
else
    echo "✗ Tool not registered"
fi

# Verify .env.example
if grep -q "FALAI_API_KEY" .env.example; then
    echo "✓ Environment variable documented"
else
    echo "✗ Environment variable not documented"
fi

# Verify migration files
if [ -f "migrations/add_nano_banana_tool.md" ]; then
    echo "✓ Migration documentation exists"
else
    echo "✗ Migration documentation missing"
fi

if [ -f "migrations/rollback_nano_banana_tool.sh" ]; then
    echo "✓ Rollback script exists"
else
    echo "✗ Rollback script missing"
fi

echo ""
echo "=================================================="
echo "Verification complete!"
echo "=================================================="
