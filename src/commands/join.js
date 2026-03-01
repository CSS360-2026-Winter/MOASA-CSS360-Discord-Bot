import { SlashCommandBuilder } from "discord.js";
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

let joinOpen = false;
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
        content: "A Mafia match is already running. Please wait for it to finish.",
        ephemeral: true
      });
    }

    // Joining is already open
    if (joinOpen) {
      if (joinedPlayers.has(userId)) {
        return interaction.reply({ content: "You already joined.", ephemeral: true });
      }

      joinedPlayers.add(userId);

      return interaction.reply({
        content: `You joined the game. Total players: ${joinedPlayers.size}`,
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

    let remaining = 15;

    await interaction.reply({
      content: generateJoinText(remaining, interaction.client, joinedPlayers),
      fetchReply: true
    });

    while (remaining > 0) {
      await sleep(1000);
      remaining--;

      if (!joinOpen) break;

      try {
        await interaction.editReply({
          content: generateJoinText(remaining, interaction.client, joinedPlayers)
        });
      } catch (error) {
        console.error("Update error:", error);
      }
    }

    // Finish recruitment
    joinOpen = false;
    const finalSize = joinedPlayers.size;

    if (finalSize < 3) {
      resetGame();
      return interaction.editReply({
        content: `Recruitment closed.\nNot enough players. (Min: 3, Current: ${finalSize})`
      });
    }

    setGameRunning(true);

    await interaction.editReply({
      content:
        `Recruitment closed.\n` +
        `Total Players: ${finalSize}\n` +
        `Members: ${formatPlayers(interaction.client, joinedPlayers)}\n\n` +
        `Roles have been assigned.\nUse /role to view your role privately.`
    });

    const roles = assignRoles(joinedPlayers);

    // Store roles and mark everyone alive
    for (const [pid, role] of roles.entries()) {
      playerRoles.set(pid, role);
      alivePlayers.add(pid);
    }

    // Ensure players exist in stats, increment games and role counts
    bulkEnsure(joinedPlayers);

    for (const [id, role] of roles.entries()) {
      incStat(id, "gamesPlayed", 1);
      if (role === "Mafia") incStat(id, "roleMafia", 1);
      else if (role === "Doctor") incStat(id, "roleDoctor", 1);
      else incStat(id, "roleCivilian", 1);
    }

    const gameId = `g_${Date.now()}_${interaction.channel.id}`;
    setCurrentGameId(gameId);

    // Snapshot baseline should include all players in the match
    beginGameSnapshot(gameId, joinedPlayers);

    await startNight(interaction.client, interaction.channel);
  }
};

function generateJoinText(timeLeft, client, players) {
  return (
    "Mafia Game Recruitment\n" +
    "Type /join to participate.\n" +
    `Closing in ${timeLeft} seconds.\n\n` +
    `Current Players (${players.size}): ${formatPlayers(client, players)}`
  );
}