import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from "discord.js";
import { assignRoles } from "../helpers/roles.js";
import {
  joinedPlayers,
  playerRoles,
  alivePlayers,
  gameRunning,
  setGameRunning,
  currentGameId,
  setCurrentGameId,
  resetGame
} from "../helpers/gameState.js";
import { startNight } from "../helpers/gameEngine.js";
import { bulkEnsure, incStat, beginGameSnapshot, cancelGameSnapshot } from "../helpers/stats.js";
import { dmRoles } from "../helpers/dmRoles.js";

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

function generateJoinText(timeLeft, client, players) {
  return (
    "**Mafia Game Recruitment**\n" +
    "Click the button below to participate!\n" +
    `Closing in **${timeLeft}** seconds.\n\n` +
    `Current Players (${players.size}): ${formatPlayers(client, players)}`
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Start a Mafia game lobby"),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (gameRunning) {
      return interaction.reply({
        content: "A Mafia match is already running. Please wait for it to finish.",
        ephemeral: true
      });
    }

    joinedPlayers.clear(); //Clear the last list
    joinedPlayers.add(userId);

    let remaining = 15;

    // Join button
    const joinButton = new ButtonBuilder()
      .setCustomId('join_game')
      .setLabel('Join Game')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(joinButton);

    const initialMessage = await interaction.reply({
      content: generateJoinText(remaining, interaction.client, joinedPlayers),
      components: [row],
      fetchReply: true
    });

    // Collector for button interactions
    const collector = initialMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: remaining * 1000
    });

    collector.on('collect', async (i) => {
      if (joinedPlayers.has(i.user.id)) {
        return i.reply({ 
          content: `⚠️ ${i.user}, You already join. please don't click join button again!`, 
          ephemeral: true 
        });
      }

      joinedPlayers.add(i.user.id);

    await interaction.editReply({
      content: generateJoinText(remaining, interaction.client, joinedPlayers)
    });

    await i.reply({ 
        content: "✅ You've joined the lobby!", 
        ephemeral: true 
      });
    });

    while (remaining > 0) {
      await sleep(1000);
      remaining--;

      try {
        await interaction.editReply({
          content: generateJoinText(remaining, interaction.client, joinedPlayers)
        });
      } catch (error) {
        console.error("Update error:", error);
        break;
      }
    }
    
    // Finish recruitment
    const finalSize = joinedPlayers.size;

    if (finalSize < 3) {
      resetGame();
      return interaction.editReply({
        content: `Recruitment closed.\nNot enough players. (Min: 3, Current: ${finalSize})`,
        components: [] // Remove buttons
      });
    }

    setGameRunning(true);
    const disabledRow = new ActionRowBuilder().addComponents(
        joinButton.setDisabled(true).setLabel('Game Started')
    );

    await interaction.editReply({
      content:
        `Recruitment closed.\n` +
        `Total Players: ${finalSize}\n` +
        `Members: ${formatPlayers(interaction.client, joinedPlayers)}\n\n` +
        `Roles have been assigned, please check your DMs for your role!\nYou may also use /role to view your role.`,
      components: [disabledRow]
    });

    const roles = assignRoles(joinedPlayers);

    // Store roles and mark everyone alive
    for (const [pid, role] of roles.entries()) {
      playerRoles.set(pid, role);
      alivePlayers.add(pid);
    }

    await dmRoles(roles, interaction.client);

    // Ensure players exist in stats, increment games and role counts
    bulkEnsure(joinedPlayers);

    for (const [id, role] of roles.entries()) {
      incStat(id, "gamesPlayed", 1);
      if (role === "Mafia") incStat(id, "roleMafia", 1);
      else if (role === "Doctor") incStat(id, "roleDoctor", 1);
      else if (role == "Fortune Teller") incStat(id, "roleFortuneTeller", 1);
      else incStat(id, "roleCivilian", 1);
    }

    const gameId = `g_${Date.now()}_${interaction.channel.id}`;
    setCurrentGameId(gameId);

    // Snapshot baseline should include all players in the match
    beginGameSnapshot(gameId, joinedPlayers);

    await startNight(interaction.client, interaction.channel);
  }
}; 