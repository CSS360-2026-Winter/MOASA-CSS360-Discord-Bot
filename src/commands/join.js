import { SlashCommandBuilder } from "discord.js";
import { assignRoles } from "../helpers/roles.js";
import { joinedPlayers, playerRoles, alivePlayers, gameRunning, setGameRunning } from "../helpers/gameState.js";
import { startNight } from "../helpers/gameEngine.js";

let joinOpen = false;
//const joinedPlayers = new Set();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatPlayers(client, players) {
  if (players.size === 0) return "None";
  return [...players]
    .map(id => {
      const user = client.users.cache.get(id);
      return user ? user.username : `<@${id}>`;
    })
    .join(", ");
}

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join the Mafia game"),

  async execute(interaction) {
    const userId = interaction.user.id;

  if (gameRunning) {
    return interaction.reply({
      content: "🚫 A Mafia match is already running. Please wait for it to finish.",
      ephemeral: true
    });
  }

  // Start joining(after first person joined)
  if (joinOpen) {
    if (joinedPlayers.has(userId)) {
      return interaction.reply({ content: `⚠️ <@${userId}>, You already join. please don't type join command again!`, 
      ephemeral: true 
    });
  }
      
    joinedPlayers.add(userId);
      
    return interaction.reply({
      content: `✅ You joined the game! Total players: ${joinedPlayers.size}`,
      ephemeral: true 
    });
  }

  // Start joining(first person)
  joinOpen = true;
  joinedPlayers.clear();
  alivePlayers.clear();
  joinedPlayers.add(userId);

  let remaining = 15; // Set to 15 seconds

  await interaction.reply({
    content: generateJoinText(remaining, interaction.client, joinedPlayers),
    fetchReply: true
  });

  // Countdwon loop
  while (remaining > 0) {
    await sleep(1000);
    remaining--;

    if (!joinOpen) break; 

    try {
      // Show the newest joinedPlayers and edit
      await interaction.editReply({
        content: generateJoinText(remaining, interaction.client, joinedPlayers)
      });
    } catch (error) {
      console.error("Update error:", error);
    }
  }

  // Finish
  joinOpen = false;
  const finalSize = joinedPlayers.size;

  if (finalSize < 3) {
    await interaction.editReply({
      content: `❌ **Recruitment Closed**\nNot enough players. (Min: 3, Current: ${finalSize})`
    });
  } else {
    setGameRunning(true);
    await interaction.editReply({
      content:
        `✅ **Recruitment Closed!**\n` +
        `Total Players: **${finalSize}**\n` +
        `Members: ${formatPlayers(interaction.client, joinedPlayers)}\n\n` +
        `🎭 Roles have been assigned!\nUse \`/role\` to view your role privately.`
    });

    const roles = assignRoles(joinedPlayers);

    // store roles for /role command
    for (const [userId, role] of roles.entries()) {
      playerRoles.set(userId, role);
      alivePlayers.add(userId);
    }
      
    await startNight(interaction.client, interaction.channel);
    }
  }
};


function generateJoinText(timeLeft, client, players) {
  return "🕵️ **Mafia Game Recruitment!**\n" +
    "Type `/join` to participate.\n" +
    `⏱ Closing in **${timeLeft}** seconds...\n\n` +
    `Current Players (**${players.size}**): ${formatPlayers(client, players)}`;
}