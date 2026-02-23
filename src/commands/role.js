// commands/role.js
import { SlashCommandBuilder } from "discord.js";
import { playerRoles } from "../helpers/gameState.js";
import { ROLE_COMMANDS } from "./roleCommands.js"

const ROLE_IMAGES = {
  Mafia: "Mafia.png",
  Doctor: "Doctor.png",
  Civilian: "Civilian.png",
};

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

    const commands = ROLE_COMMANDS[role] || "Good luck!";
    const imageFile = ROLE_IMAGES[role];

    try {
      await interaction.reply({
        content:
          `🎭 **Your Role: ${role}**\n\n` +
          `${commands}\n\n` +
          "Do not reveal your role to other players.\n" +
          "Use `/mycommands` to view your role's commands at any time.\n" +
          "Good luck… 😈",
        files: imageFile ? [`./src/images/${imageFile}`] : [],
        ephemeral: true,
      });
    } catch (err) {
      console.error("Role image error:", err);

      await interaction.reply({
        content:
          `🎭 **Your Role: ${role}**\n\n` +
          `${commands}`,
        ephemeral: true,
      });
    }
  },
};
