#!/bin/sh
set -e

echo "🚀 Starting TempVoice Bot..."
echo ""

# Deploy slash commands to Discord
echo "📝 Deploying slash commands..."
node deploy-commands.js

echo ""
echo "✅ Commands deployed successfully!"
echo ""

# Start the bot
echo "🤖 Starting bot..."
exec node src/index.js
