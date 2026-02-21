import { alivePlayers, setPhase, nightActions, playerRoles, votes} from "./gameState.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Night phase
export const startNight = async (client, channel) => {
  let nightAccomplished = false;
  
  // We only reset targets to null the VERY FIRST time the night starts
  nightActions.mafiaTarget = null;
  nightActions.doctorTarget = null;

  while (!nightAccomplished) {
    setPhase("NIGHT");

    const aliveIds = Array.from(alivePlayers.keys());
    const isMafiaAlive = aliveIds.some(id => playerRoles.get(id) === "Mafia");
    const isDoctorAlive = aliveIds.some(id => playerRoles.get(id) === "Doctor");

    await channel.send("🌙 **Night falls on the village.**\n" + 
                       "The Mafia and Doctor have **30 seconds** to act!");

    let timer = 30;
    while (timer > 0) {
      // Check if roles that are ALIVE have finished their actions
      const mafiaDone = !isMafiaAlive || nightActions.mafiaTarget !== null;
      const doctorDone = !isDoctorAlive || nightActions.doctorTarget !== null;

      if (mafiaDone && doctorDone) break; 

      await sleep(1000);
      timer--;
    }

    const mafiaFailed = isMafiaAlive && nightActions.mafiaTarget === null;
    const doctorFailed = isDoctorAlive && nightActions.doctorTarget === null;

    if (mafiaFailed || doctorFailed) {
      const slacker = (mafiaFailed && doctorFailed) ? "Both parties" : (mafiaFailed ? "The Mafia" : "The Doctor");
      await channel.send(`💤 **${slacker} failed to act!** The night is resetting... (Targets are saved)`);
      await sleep(3000); 
      // Loop repeats: notice we DO NOT set targets to null here anymore.
    } else {
      nightAccomplished = true; 
    }
  }

  await channel.send("⌛ **The sun begins to rise...**");
  await sleep(3000);
  await resolveNight(client, channel);
};

async function resolveNight(client, channel) {
  setPhase("DAY");
  const { mafiaTarget, doctorTarget } = nightActions;

  if (mafiaTarget && mafiaTarget === doctorTarget) {
    try {
      // Trying the most likely path based on your folder structure
      const imagePath = "./src/helpers/doctor-save.png";
      
      await channel.send({
        content: "🏥 **The Mafia attacked last night, but the Doctor saved the victim!** No one died.",
        files: [imagePath] 
      });
    } catch (error) {
      // This will print the exact reason in your terminal (black screen)
      console.error("❌ Image upload failed. Check this path:", error.path || "Unknown path");
      console.error("Full Error:", error.message);

      await channel.send("🏥 **The Mafia attacked last night, but the Doctor saved the victim!** No one died.");
    }
  } 
  else if (mafiaTarget) {
    const role = playerRoles.get(mafiaTarget);
    alivePlayers.delete(mafiaTarget);
    await channel.send(`🩸 **Tragedy strikes!** <@${mafiaTarget}> was found dead. They were a **${role}**.`);
  } 
  else {
    await channel.send("🕊️ **A quiet night.** Nothing happened...");
  }

  // NEW: check win condition after night resolves
  const aliveArray = [...alivePlayers];
  const mafiaAlive = aliveArray.filter(id => playerRoles.get(id) === "Mafia").length;
  const townAlive = aliveArray.length - mafiaAlive;

  if (mafiaAlive === 0) {
    setPhase("ENDED");
    return channel.send("🎉 **Civilians Win!** All Mafia members have been eliminated.");
  }

  if (mafiaAlive >= townAlive) {
    setPhase("ENDED");
    return channel.send("🔪 **Mafia Wins!** They have taken over the village.");
  }

  // Day phase begins only if the game is NOT over
  await startDay(client, channel);
}


async function startDay(client, channel) {
  setPhase("DAY");
  votes.clear(); // Ensure votes are empty at the start of the day

  let timer = 60; // Initial voting duration
  const voteImagePath = "./src/helpers/vote-processing.png"; // ✅ Path to your image

  // 1. Send initial message WITH the image
  const votingMsg = await channel.send({
    content: `☀️ **Day Phase begins.**\n` +
             `**Players discuss** and use \`/vote\` to identify the Mafia.\n` +
             `⌛ Voting closes in **${timer}** seconds!`,
    files: [voteImagePath] // ✅ Image added here
  });

  // 2. Countdown loop
  while (timer > 0) {
    if (votes.size === alivePlayers.size && alivePlayers.size > 0) break;

    await sleep(1000); 
    timer--;          

    try {
      // Edit the text while keeping the image attached
      await votingMsg.edit({
        content: `☀️ **Day Phase begins.**\n` +
                 `**Players discuss** and use \`/vote\` to identify the Mafia.\n` +
                 `⌛ Voting closes in **${timer}** seconds!`
      });
    } catch (error) {
      console.error("Voting timer update error:", error);
      break; 
    }
  }

  // 3. Final update when voting finishes
  await votingMsg.edit({
    content: "☀️ **Day Phase begins.**\n⌛ **Voting has closed!** Processing votes..."
  });
  
  await sleep(2000);
  await resolveDay(client, channel);
}

async function resolveDay(client, channel) {
  if (votes.size === 0) {
    await channel.send("🤷 **No one voted.** Since the town is silent, we will vote again.");
    return startDay(client, channel);
  }

  // Tally votes
  const tally = {};
  for (const targetId of votes.values()) {
    tally[targetId] = (tally[targetId] || 0) + 1;
  }

  const sortedVotes = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxVotes = sortedVotes[0][1];
  const candidates = sortedVotes.filter(v => v[1] === maxVotes);

  // Revote if there is a tie
  if (candidates.length > 1) {
    await channel.send("⚖️ **It's a tie!** The town is deadlocked. You must vote again!");
    await sleep(3000);
    // Recursively call startDay to prompt for a new vote
    return startDay(client, channel); 
  }

  // If no tie, eliminate the player
  const eliminatedId = candidates[0][0];
  const role = playerRoles.get(eliminatedId);
  alivePlayers.delete(eliminatedId);

  await channel.send(`⚖️ By majority vote, <@${eliminatedId}> has been eliminated. They were the **${role}**.`);

  await checkWinAndContinue(client, channel);
}

async function checkWinAndContinue(client, channel) {
  const aliveArray = [...alivePlayers];
  const mafiaAlive = aliveArray.filter(id => playerRoles.get(id) === "Mafia").length;
  const townAlive = aliveArray.length - mafiaAlive;

  // Win Condition Checks
  if (mafiaAlive === 0) {
    setPhase("ENDED");
    return channel.send("🎉 **Civilians Win!** All Mafia members have been eliminated.");
  }
  if (mafiaAlive >= townAlive) {
    setPhase("ENDED");
    return channel.send("🔪 **Mafia Wins!** They have taken over the village.");
  }

  // If game continues, loop back to Night
  await channel.send("🌙 The sun sets. Prepare for the next night...");
  await sleep(3000);
  await startNight(client, channel);
}