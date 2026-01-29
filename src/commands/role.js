import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const ROLES = {
  mafia: {
    name: "🕵️ Mafia",
    faction: "Mafia",
    description: "Each night, choose one player to eliminate.",
    win: "Eliminate all civilians."
  },
  doctor: {
    name: "🩺 Doctor",
    faction: "Civilians",
    description: "Each night, choose one player to protect. You cannot protect yourself.",
    win: "Identify and eliminate all Mafia members."
  },
  civilian: {
    name: "👥 Civilian",
    faction: "Civilians",
    description: "No special abilities.",
    win: "Identify and eliminate all Mafia members."
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName("mafia")
    .setDescription("Mafia game commands")
    .addSubcommand(sub =>
      sub
        .setName("role")
        .setDescription("View all roles in the Mafia game")
    ),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🕵️ Mafia Roles")
      .setColor(0x8b0000)
      .setFooter({ text: "Roles shown here do not reveal any player's identity." });

    for (const role of Object.values(ROLES)) {
      embed.addFields({
        name: role.name,
        value:
          `**Faction:** ${role.faction}\n` +
          `**Ability:** ${role.description}\n` +
          `**Win Condition:** ${role.win}`
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
