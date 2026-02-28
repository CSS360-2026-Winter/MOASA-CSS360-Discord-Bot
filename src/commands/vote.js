import { SlashCommandBuilder } from "discord.js";
import { votes, currentPhase, alivePlayers } from "../helpers/gameState.js";
import { incStat } from "../helpers/stats.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Vote to eliminate a player")
    .addUserOption(opt =>
      opt.setName("target")
        .setDescription("The person you think is Mafia")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (currentPhase !== "DAY") {
      return interaction.reply({ content: "You can only vote during the Day.", ephemeral: true });
    }

    if (!alivePlayers.has(userId)) {
      return interaction.reply({ content: "You are dead. You cannot vote.", ephemeral: true });
    }

    const target = interaction.options.getUser("target");

    if (!alivePlayers.has(target.id)) {
      return interaction.reply({ content: "That player is already dead.", ephemeral: true });
    }

    const prevTargetId = votes.get(userId);

    // Count a "vote" only the first time the player votes this day
    if (!prevTargetId) {
      incStat(userId, "timesVoted", 1);
    }

    // If they are changing targets, undo the previous accused increment
    if (prevTargetId && prevTargetId !== target.id) {
      incStat(prevTargetId, "timesVotedAgainst", -1);
    }

    // Only increment accused if this is a new target (first vote or changed vote)
    if (prevTargetId !== target.id) {
      incStat(target.id, "timesVotedAgainst", 1);
    }

    votes.set(userId, target.id);

    await interaction.reply({
      content: `Your vote for ${target.username} has been recorded.`,
      ephemeral: true
    });

    await interaction.channel.send(
      `${interaction.user.username} has cast a vote. (${votes.size}/${alivePlayers.size} votes cast)`
    );
  }
};