import { SlashCommandBuilder } from "discord.js";

let joinOpen = false;
const joinedPlayers = new Set();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatPlayers(client, players) {
  if (players.size === 0) return "None";
  return [...players]
    .map(id => {
      const user = client.users.cache.get(id);
      return user ? user.username : `<@${id}>`;
    })
    .join(", ");
}

export default {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join the Mafia game"),

  async execute(interaction) {
    const userId = interaction.user.id;

    // ===== 2人目以降の参加処理 =====
    if (joinOpen) {
      if (joinedPlayers.has(userId)) {
        return interaction.reply({ content: "You already joined!", ephemeral: true });
      }
      
      joinedPlayers.add(userId);
      
      // 他の人には見せない「参加完了」メッセージを出すことでエラーを防ぐ
      return interaction.reply({
        content: `✅ You joined the game! Total players: ${joinedPlayers.size}`,
        ephemeral: true 
      });
    }

    // ===== 1人目：募集開始 =====
    joinOpen = true;
    joinedPlayers.clear();
    joinedPlayers.add(userId);

    let remaining = 15; // 15秒に設定

    await interaction.reply({
      content: generateJoinText(remaining, interaction.client, joinedPlayers),
      fetchReply: true
    });

    // カウントダウンループ
    while (remaining > 0) {
      await sleep(1000);
      remaining--;

      if (!joinOpen) break; // 途中で強制終了された場合用

      try {
        // 常に最新の joinedPlayers を反映して編集
        await interaction.editReply({
          content: generateJoinText(remaining, interaction.client, joinedPlayers)
        });
      } catch (error) {
        console.error("Update error:", error);
      }
    }

    // ===== 募集終了処理 =====
    joinOpen = false;
    const finalSize = joinedPlayers.size;

    if (finalSize < 3) {
      await interaction.editReply({
        content: `❌ **Recruitment Closed**\nNot enough players. (Min: 3, Current: ${finalSize})`
      });
    } else {
      await interaction.editReply({
        content: `✅ **Recruitment Closed!**\nTotal Players: **${finalSize}**\nMembers: ${formatPlayers(interaction.client, joinedPlayers)}\n\nUse \`/mafia start\` to begin!`
      });
    }
  }
};

function generateJoinText(timeLeft, client, players) {
  return "🕵️ **Mafia Game Recruitment!**\n" +
    "Type `/join` to participate.\n" +
    `⏱ Closing in **${timeLeft}** seconds...\n\n` +
    `Current Players (**${players.size}**): ${formatPlayers(client, players)}`;
}