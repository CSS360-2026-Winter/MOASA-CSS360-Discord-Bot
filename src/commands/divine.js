const { SlashCommandBuilder } = require("discord.js");
const GameState = require("../helpers/gameState.js");
const playerRoles = GameState.playerRoles;
const nightActions = GameState.nightActions;
const alivePlayers = GameState.alivePlayers;
const getCurrentPhase = GameState.getCurrentPhase;
const stats = require("../helpers/stats.js"); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName("divine")
    .setDescription("Fortune Teller only: Check if a player is a Mafia member.")
    .addUserOption(option =>
      option
        .setName("target")
        .setDescription("The player you want to investigate")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const targetUser = interaction.options.getUser("target");
      const phase = getCurrentPhase();

      //Check if the current phase is night
      if (phase !== "NIGHT") {
        return interaction.reply({ 
          content: `☀️ This power can only be used during the **NIGHT**.`, 
          ephemeral: true 
        });
      }

      //Check if the user has Fortune Teller role
      if (playerRoles.get(userId) !== "Fortune Teller") {
        return interaction.reply({ content: "🔮 Only the **Fortune Teller** can use this power.", ephemeral: true });
      }

      //Check if user has already acted tonight
      if (nightActions.fortuneTellerTarget) {
        return interaction.reply({ content: "You have already received a vision tonight.✨", ephemeral: true });
      }

      //Check if the target player is still alive
      if (!alivePlayers.has(targetUser.id)) {
        return interaction.reply({ content: "👻 That player is already dead!", ephemeral: true });
      }

      //Execute divination logic
      const targetRole = playerRoles.get(targetUser.id);
      const isMafia = targetRole === "Mafia";

      // Save target
      nightActions.fortuneTellerTarget = targetUser.id;

      //Update stats
      if (isMafia && stats && typeof stats.incStat === "function") {
        stats.incStat(userId, "divineSuccesses", 1);
      }

      await interaction.reply({
        content: `🔮 **Divination Result:**\n**${targetUser.username}** is ${isMafia ? "a **MAFIA MEMBER** 🕶️🍷" : "not a Mafia member! 🧑"}`,
        ephemeral: true
      });

    } catch (error) {
      console.error("Divine command error:", error);
      await interaction.reply({ 
        content: `❌ An internal error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
};