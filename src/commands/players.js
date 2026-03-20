import { SlashCommandBuilder } from "discord.js";
import { joinedPlayers, alivePlayers, gameRunning } from "../helpers/gameState.js";

export default {
  data: new SlashCommandBuilder()
    .setName("players")
    .setDescription("Show current players and whether they are alive or dead"),

  async execute(interaction) {
    if (joinedPlayers.size === 0) {
      return interaction.reply({
        content: "There is no active lobby or game right now.",
        ephemeral: true,
      });
    }

    const lines = [...joinedPlayers].map((id) => {
      const name = interaction.client.users.cache.get(id)?.username || `<@${id}>`;
      const status = gameRunning
        ? (alivePlayers.has(id) ? "Alive" : "Dead")
        : "In Lobby";
      return `${name} - ${status}`;
    });

    return interaction.reply({
      content: `**Current Players**\n\n${lines.join("\n")}`,
    });
  },
};