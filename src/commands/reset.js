import { SlashCommandBuilder } from "discord.js";
import { resetGame } from "../helpers/gameState.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset the Mafia game (admin only)"),

  async execute(interaction) {
    resetGame();
    await interaction.reply({ content: "✅ Game has been reset!", ephemeral: true });
  },
};
