import {
  alivePlayers,
  setPhase,
  nightActions,
  playerRoles,
  votes,
  setGameRunning,
  currentGameId,
  setCurrentGameId
} from "./gameState.js";

import { incStat, endGameSnapshot } from "./stats.js";

/*
  gameEngine.js

  What this file controls:
  - The full game loop: Night -> Day -> Night -> ... -> End
  - Timers and resets for phases
  - Resolving actions (kills, saves, voting eliminations)
  - Win checks after each resolution
  - Per-game snapshot finalization for the /stats recent games section

  Core shared state is stored in helpers/gameState.js:
  - alivePlayers: Set of userIds still alive
  - playerRoles: Map userId -> role string
  - votes: Map voterId -> targetId (only used during Day)
  - nightActions: { mafiaTarget, doctorTarget }
  - currentGameId: string used by stats snapshots
*/

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/*
  Helper: sendWithOptionalFiles

  Discord can throw if the file path is wrong, missing, or permissions are weird.
  If sending with files fails, we fall back to sending just the text so the match
  keeps going instead of dying mid-phase.
*/
async function sendWithOptionalFiles(channel, payload) {
  const { files, content, ...rest } = payload;

  if (!files || files.length === 0) {
    return channel.send({ content, ...rest });
  }

  try {
    return await channel.send({ content, files, ...rest });
  } catch (err) {
    console.error("Send with files failed:", err?.message || err);
    return channel.send({ content, ...rest });
  }
}

/*
  Helper: finalizeGameSnapshotIfAny

  When a game ends, we close the stats snapshot so /stats can show recent games.
  This must be called on every win path, otherwise the snapshot stays active.
*/
function finalizeGameSnapshotIfAny() {
  if (!currentGameId) return;
  endGameSnapshot(currentGameId);
  setCurrentGameId(null);
}

/*
  startNight

  Responsibilities:
  - Set phase to NIGHT
  - Reset the night targets for this night (mafiaTarget and doctorTarget)
  - Run a timer so Mafia and Doctor can act
  - If required actions were not taken, reset the timer but keep any targets already chosen
  - Once night actions are finished, resolve the outcomes and move to Day
*/
export const startNight = async (client, channel) => {
  let nightAccomplished = false;

  // Reset targets at the start of each night.
  // Important: this happens once per night, not once per match.
  nightActions.mafiaTarget = null;
  nightActions.doctorTarget = null;

  await sendWithOptionalFiles(channel, {
    content: "Night falls on the village.",
    files: ["./src/images/NightPhase.png"]
  });

  /*
    Night loop:
    - We allow the night to restart if a required role does not act in time.
    - Targets are NOT cleared on a restart because someone may have already acted.
    - This prevents frustration where a valid action gets wiped because another role timed out.
  */
  while (!nightAccomplished) {
    setPhase("NIGHT");

    // alivePlayers is a Set, so turn it into an array for convenience.
    const aliveIds = Array.from(alivePlayers);

    // Only require an action if that role exists AND is alive.
    const isMafiaAlive = aliveIds.some(id => playerRoles.get(id) === "Mafia");
    const isDoctorAlive = aliveIds.some(id => playerRoles.get(id) === "Doctor");

    let timer = 30;

    const timerMsg = await channel.send(
      `The Mafia and Doctor have ${timer} seconds to act.`
    );

    // Countdown. Break early if all required actions are completed.
    while (timer > 0) {
      const mafiaDone = !isMafiaAlive || nightActions.mafiaTarget !== null;
      const doctorDone = !isDoctorAlive || nightActions.doctorTarget !== null;

      if (mafiaDone && doctorDone) break;

      await sleep(1000);
      timer--;

      try {
        await timerMsg.edit(
          `The Mafia and Doctor have ${timer} seconds to act.`
        );
      } catch (err) {
        // If we cannot edit the message, stop editing but keep the game moving.
        console.error("Night timer edit error:", err);
        break;
      }
    }

    // If a role was required and did not act, the night restarts.
    const mafiaFailed = isMafiaAlive && nightActions.mafiaTarget === null;
    const doctorFailed = isDoctorAlive && nightActions.doctorTarget === null;

    if (mafiaFailed || doctorFailed) {
      const slacker = (mafiaFailed && doctorFailed)
        ? "Both parties"
        : (mafiaFailed ? "The Mafia" : "The Doctor");

      await channel.send(`${slacker} failed to act. The night is resetting. Targets are saved.`);
      await sleep(3000);
      await timerMsg.delete().catch(() => {});
    } else {
      nightAccomplished = true;
      await timerMsg.delete().catch(() => {});
    }
  }

  await sendWithOptionalFiles(channel, {
    content: "The sun begins to rise.",
    files: ["./src/images/MorningPhase.png"]
  });

  await sleep(3000);
  await resolveNight(client, channel);
};

/*
  resolveNight

  Responsibilities:
  - Apply night outcomes based on nightActions
  - Update stats (killsAsMafia, savesAsDoctor, timesKilled)
  - Remove a killed player from alivePlayers
  - Check win conditions AFTER night outcomes
  - If no win, begin Day
*/
async function resolveNight(client, channel) {
  setPhase("DAY");

  const { mafiaTarget, doctorTarget } = nightActions;

  // Case 1: Mafia attacked and Doctor saved the same target
  if (mafiaTarget && mafiaTarget === doctorTarget) {
    // Credit one alive Doctor for the save.
    // If you support multiple doctors later, you may want to credit the actual acting doctor.
    const doctorIds = [...alivePlayers].filter(id => playerRoles.get(id) === "Doctor");
    if (doctorIds.length > 0) incStat(doctorIds[0], "savesAsDoctor", 1);

    await sendWithOptionalFiles(channel, {
      content: "The Mafia attacked last night, but the Doctor saved the victim. No one died.",
      files: ["./src/helpers/doctor-save.png"]
    });
  }
  // Case 2: Mafia attacked and the target was not saved
  else if (mafiaTarget) {
    const role = playerRoles.get(mafiaTarget);

    // Victim stat
    incStat(mafiaTarget, "timesKilled", 1);

    // Credit one alive Mafia for the kill.
    // If you support multiple mafia later, you might want to credit all mafia or the specific actor.
    const mafiaIdsForCredit = [...alivePlayers].filter(id => playerRoles.get(id) === "Mafia");
    if (mafiaIdsForCredit.length > 0) incStat(mafiaIdsForCredit[0], "killsAsMafia", 1);

    // Remove from alive players set
    alivePlayers.delete(mafiaTarget);

    // Optional DM to victim. Guarded so DM failure does not break the match.
    try {
      const victim = await client.users.fetch(mafiaTarget);
      const mafiaIds = [...alivePlayers].filter(id => playerRoles.get(id) === "Mafia");
      const killer = mafiaIds.length > 0 ? `<@${mafiaIds[0]}>` : "Unknown";

      await victim.send(
        `You were killed during the night.\n\n` +
        `The Mafia member responsible was: ${killer}`
      );
    } catch (err) {
      console.error("Failed to DM victim:", err);
    }

    await sendWithOptionalFiles(channel, {
      content: `<@${mafiaTarget}> was found dead. They were the ${role}.`,
      files: ["./src/images/CivillanKilled.png"]
    });
  }
  // Case 3: Mafia did not attack (or no mafia alive)
  else {
    await sendWithOptionalFiles(channel, {
      content: "A quiet night. Nothing happened.",
      files: ["./src/images/QuietNight.png"]
    });
  }

  // Win check after night outcomes
  const aliveArray = [...alivePlayers];
  const mafiaAlive = aliveArray.filter(id => playerRoles.get(id) === "Mafia").length;
  const townAlive = aliveArray.length - mafiaAlive;

  if (mafiaAlive === 0) {
    setPhase("ENDED");
    setGameRunning(false);
    finalizeGameSnapshotIfAny();

    return sendWithOptionalFiles(channel, {
      content: "Civilians win. All Mafia members have been eliminated.",
      files: ["./src/images/CivilianWin.png"]
    });
  }

  if (mafiaAlive >= townAlive) {
    setPhase("ENDED");
    setGameRunning(false);
    finalizeGameSnapshotIfAny();

    return sendWithOptionalFiles(channel, {
      content: "Mafia wins. They have taken over the village.",
      files: ["./src/images/MafiaWin.png"]
    });
  }

  // If no win, start the Day phase
  await startDay(client, channel);
}

/*
  startDay

  Responsibilities:
  - Set phase to DAY
  - Clear votes for the new day
  - Start a voting timer
  - End voting early if all alive players have voted
  - After the timer, resolve the vote
*/
async function startDay(client, channel) {
  setPhase("DAY");

  // Reset the vote map each day so old votes cannot leak into the next day.
  votes.clear();

  let timer = 60;
  const voteImagePath = "./src/helpers/vote-processing.png";

  // Send the initial Day Phase message.
  // This uses the safe sender so missing images do not crash the match.
  const votingMsg = await sendWithOptionalFiles(channel, {
    content:
      `Day Phase begins.\n` +
      `Players discuss and use /vote to identify the Mafia.\n` +
      `Voting closes in ${timer} seconds.`,
    files: [voteImagePath]
  });

  // Countdown loop for voting.
  while (timer > 0) {
    // End early if everyone alive has voted.
    if (votes.size === alivePlayers.size && alivePlayers.size > 0) break;

    await sleep(1000);
    timer--;

    try {
      await votingMsg.edit({
        content:
          `Day Phase begins.\n` +
          `Players discuss and use /vote to identify the Mafia.\n` +
          `Voting closes in ${timer} seconds.`
      });
    } catch (error) {
      // If edits fail, stop editing but continue the match.
      console.error("Voting timer update error:", error);
      break;
    }
  }

  await votingMsg.edit({
    content: "Voting has closed. Processing votes."
  });

  await sleep(2000);
  await resolveDay(client, channel);
}

/*
  resolveDay

  Responsibilities:
  - If nobody voted, re-run the day
  - Tally votes and eliminate the highest target
  - If there is a tie, force a revote
  - Update stats for the eliminated player (timesVotedOut)
  - After elimination, check win conditions
*/
async function resolveDay(client, channel) {
  if (votes.size === 0) {
    await channel.send("No one voted. Voting again.");
    return startDay(client, channel);
  }

  // Tally votes by targetId
  const tally = {};
  for (const targetId of votes.values()) {
    tally[targetId] = (tally[targetId] || 0) + 1;
  }

  // Sort targets by votes received
  const sortedVotes = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxVotes = sortedVotes[0][1];
  const candidates = sortedVotes.filter(v => v[1] === maxVotes);

  // Tie means revote
  if (candidates.length > 1) {
    await channel.send("It is a tie. Vote again.");
    await sleep(3000);
    return startDay(client, channel);
  }

  // Single elimination target
  const eliminatedId = candidates[0][0];
  const role = playerRoles.get(eliminatedId);

  alivePlayers.delete(eliminatedId);

  // Stat for being voted out
  incStat(eliminatedId, "timesVotedOut", 1);

  await channel.send(`By majority vote, <@${eliminatedId}> has been eliminated. They were the ${role}.`);

  await checkWinAndContinue(client, channel);
}

/*
  checkWinAndContinue

  Responsibilities:
  - Evaluate win conditions after a Day elimination
  - If game ends, finalize snapshot and stop
  - If game continues, go back to Night
*/
async function checkWinAndContinue(client, channel) {
  const aliveArray = [...alivePlayers];
  const mafiaAlive = aliveArray.filter(id => playerRoles.get(id) === "Mafia").length;
  const townAlive = aliveArray.length - mafiaAlive;

  if (mafiaAlive === 0) {
    setPhase("ENDED");
    setGameRunning(false);
    finalizeGameSnapshotIfAny();

    return sendWithOptionalFiles(channel, {
      content: "Civilians win. All Mafia members have been eliminated.",
      files: ["./src/images/CivilianWin.png"]
    });
  }

  if (mafiaAlive >= townAlive) {
    setPhase("ENDED");
    setGameRunning(false);
    finalizeGameSnapshotIfAny();

    return sendWithOptionalFiles(channel, {
      content: "Mafia wins. They have taken over the village.",
      files: ["./src/images/MafiaWin.png"]
    });
  }

  // No win yet, start next Night
  await channel.send("The sun sets. Prepare for the next night.");
  await sleep(3000);
  await startNight(client, channel);
}