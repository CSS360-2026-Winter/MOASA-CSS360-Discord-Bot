import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getAllStats, getRecentGames } from "../helpers/stats.js";

function lifetimeScore(s) {
  return (
    (s.gamesPlayed * 2) +
    (s.killsAsMafia * 3) +
    (s.savesAsDoctor * 3) +
    (s.timesVotedOut * 1) +
    (s.timesKilled * 1)
  );
}

function gameScoreDelta(d) {
  return (
    (d.killsAsMafia * 3) +
    (d.savesAsDoctor * 3) +
    (d.timesVotedOut * 1) +
    (d.timesKilled * 1)
  );
}

function fmtLifetimeLine(id, s, rank) {
  return (
    `${rank}. <@${id}>` +
    ` | games ${s.gamesPlayed}` +
    ` | voted ${s.timesVoted}` +
    ` | accused ${s.timesVotedAgainst}` +
    ` | votedOut ${s.timesVotedOut}` +
    ` | killed ${s.timesKilled}` +
    ` | mafiaKills ${s.killsAsMafia}` +
    ` | doctorSaves ${s.savesAsDoctor}`
  );
}

function fmtDeltaLine(id, d, rank) {
  return (
    `${rank}. <@${id}>` +
    ` | voted ${d.timesVoted}` +
    ` | accused ${d.timesVotedAgainst}` +
    ` | votedOut ${d.timesVotedOut}` +
    ` | killed ${d.timesKilled}` +
    ` | mafiaKills ${d.killsAsMafia}` +
    ` | doctorSaves ${d.savesAsDoctor}`
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show player stats across all games and recent games"),

  async execute(interaction) {
    const db = getAllStats();

    const lifetimeEntries = Object.entries(db)
      .filter(([k]) => !k.startsWith("_"))
      .sort((a, b) => lifetimeScore(b[1]) - lifetimeScore(a[1]))
      .slice(0, 10);

    const lifetimeLines = lifetimeEntries.length
      ? lifetimeEntries.map(([id, s], i) => fmtLifetimeLine(id, s, i + 1)).join("\n")
      : "No lifetime stats recorded yet.";

    const recentGames = getRecentGames(2);
    const gameSections = recentGames.length
      ? recentGames.map((g, idx) => {
          const label = idx === recentGames.length - 1 ? "Game 1 (most recent)" : "Game 2";
          const perPlayer = Object.entries(g.players || {})
            .sort((a, b) => gameScoreDelta(b[1]) - gameScoreDelta(a[1]))
            .slice(0, 10);

          const lines = perPlayer.length
            ? perPlayer.map(([id, d], i) => fmtDeltaLine(id, d, i + 1)).join("\n")
            : "No per-game stats found.";

          return { label, lines };
        })
      : [];

    const embed = new EmbedBuilder()
      .setTitle("Mafia Bot Stats")
      .setDescription("Lifetime totals and recent game breakdown.")
      .addFields({
        name: "Lifetime leaderboard (top 10)",
        value: lifetimeLines
      });

    for (const sec of gameSections) {
      embed.addFields({
        name: sec.label,
        value: sec.lines
      });
    }

    return interaction.reply({
      embeds: [embed],
      allowedMentions: { parse: [] } // shows names, does not ping
    });
  }
};
