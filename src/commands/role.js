// commands/role.js
import { SlashCommandBuilder } from "discord.js";
import { playerRoles } from "../helpers/gameState.js";

export default {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("View your Mafia role"),

  async execute(interaction) {
    const role = playerRoles.get(interaction.user.id);

    if (!role) {
      return interaction.reply({
        content: "❌ You are not part of an active Mafia game.",
        ephemeral: true,
      });
    }

    await interaction.reply({
      content:
        `🎭 **Your Role: ${role}**\n\n` +
        "Do not reveal your role to other players.\n" +
        "Good luck… 😈",
      ephemeral: true,
    });
  },
};
