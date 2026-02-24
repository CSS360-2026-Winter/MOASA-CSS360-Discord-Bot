import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadEvents } from "./helpers";
import path from "path";
import { loadCommands } from "./helpers/loadCommands";
import { alivePlayers, currentPhase } from "./helpers/gameState";



const TOKEN = process.env.TOKEN;

const { Guilds, GuildMembers, GuildMessages, MessageContent } =
  GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;

const client = new Client({
  intents: [Guilds, GuildMembers, GuildMessages, MessageContent],
  partials: [User, Message, GuildMember, ThreadMember],
});


client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.name !== "mafia-game") return;

  if (currentPhase === "PRE_GAME" || currentPhase === "ENDED") return;

  if (!alivePlayers.has(message.author.id)) {
    await message.delete().catch(() => {});
    await message.author.send("☠️ You are a dead civilian.. Please refrain from putting messages in the mafia channel... Dead men tell no tales...");
  }
});

client.events = new Collection();

loadEvents(client, path.join(__dirname, "events"));

client.commands = new Collection();
loadCommands(client, path.join(__dirname, "commands"));


client.login(TOKEN);
