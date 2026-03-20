import { SlashCommandBuilder } from "discord.js";

const FORTUNES = [
  "A patient hand is often the last hand standing.",
  "When all is settled, the quiet one may profit most.",
  "A sharp smile can hide a sharper intention.",
  "The truth arrives late, but it rarely arrives alone.",
  "Not every kind face carries kind plans.",
  "Fortune favors the one who watches before acting.",
  "A man who speaks less often hears more than he should.",
  "What is done in darkness is still done.",
  "A clever heart survives what a reckless one cannot.",
  "Suspicion follows success more often than failure.",
  "The most dangerous person in the room rarely looks dangerous.",
  "A calm voice can carry a cruel decision.",
  "One secret kept well can outlive ten promises.",
  "The wise do not rush when others begin to panic.",
  "A steady hand may inherit what chaos leaves behind.",
  "Even a gentle soul can choose a ruthless hour.",
  "In the end, timing will matter more than force.",
  "He who is underestimated should stay that way.",
  "A pleasant face may conceal an unpleasant plan.",
  "Luck often visits the one already prepared for it.",
  "The last word is not always the truest one.",
  "A man may lose the moment and still win the night.",
  "What looks like mercy may simply be patience.",
  "Great fortune sometimes waits behind a terrible choice.",
  "The one who survives the storm is not always the best man.",
  "A sweet promise can carry a bitter cost.",
  "Someone near you has learned the value of silence.",
  "The bold attract attention. The careful collect results.",
  "After all is said and done, the patient one may take the prize.",
  "Not every warning is meant to save you."
];

export default {
  data: new SlashCommandBuilder()
    .setName("fortune")
    .setDescription("Open a classic fortune cookie"),

  async execute(interaction) {
    const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

    return interaction.reply({
      content: `🥠 **Your Fortune**\n${randomFortune}`,
    });
  },
};