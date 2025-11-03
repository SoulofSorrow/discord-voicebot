import pkg from 'discord.js';
const { REST, Routes } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'src/commands');

try {
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  console.log('📋 Loading commands...');

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`   ✅ Loaded: ${command.data.name}`);
    } else {
      console.log(`   ⚠️  Skipped ${file}: missing 'data' or 'execute'`);
    }
  }

  console.log(`\n📦 Total commands loaded: ${commands.length}`);
} catch (error) {
  console.error('❌ Error loading commands:', error);
  process.exit(1);
}

// Validate environment variables
const { DISCORD_TOKEN, GUILD_ID, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('❌ GUILD_ID is not set in .env file');
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error('❌ CLIENT_ID is not set in .env file');
  console.log('💡 Tip: Get your CLIENT_ID from the Discord Developer Portal (Application ID)');
  process.exit(1);
}

// Create REST client
const rest = new REST().setToken(DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

    // Deploy to specific guild (faster for testing)
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log(`✅ Successfully registered ${data.length} application (/) commands.`);
    console.log('\n📋 Registered commands:');
    data.forEach(cmd => {
      console.log(`   - /${cmd.name} (ID: ${cmd.id})`);
    });

    console.log('\n🎉 Command deployment complete!');
    console.log('💡 Commands should appear in Discord within a few seconds.\n');
  } catch (error) {
    console.error('❌ Error deploying commands:', error);

    if (error.code === 50001) {
      console.error('\n⚠️  Missing Access: The bot doesn\'t have access to the guild.');
      console.error('   Make sure the bot is invited to your server.');
    } else if (error.code === 10004) {
      console.error('\n⚠️  Unknown Guild: GUILD_ID is invalid.');
      console.error('   Check your GUILD_ID in the .env file.');
    } else if (error.code === 40060) {
      console.error('\n⚠️  Interaction Already Registered: Commands may already exist.');
      console.error('   This is usually fine - commands were updated.');
    }

    process.exit(1);
  }
})();
