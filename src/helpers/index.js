export { default as loadEvents } from "./loadEvents";
export { default as loadFiles } from "./loadFiles";
import { alivePlayers, currentPhase } from "./helpers/gameState.js";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.name !== "mafia-game") return;

  if (currentPhase === "PRE_GAME" || currentPhase === "ENDED") return;

  if (!alivePlayers.has(message.author.id)) {
    await message.delete().catch(() => {});
    await message.author.send("☠️ Dead men tell no tales...");
  }
});

