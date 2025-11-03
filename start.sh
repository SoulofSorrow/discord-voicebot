#!/bin/sh

echo "🚀 Starting TempVoice Bot..."
echo ""

# Deploy slash commands to Discord (don't fail if deployment has issues)
echo "📝 Deploying slash commands..."
if node deploy-commands.js; then
  echo ""
  echo "✅ Commands deployed successfully!"
else
  echo ""
  echo "⚠️  Command deployment had issues, but continuing bot startup..."
fi

echo ""

# Start the bot
echo "🤖 Starting bot..."
exec node src/index.js
