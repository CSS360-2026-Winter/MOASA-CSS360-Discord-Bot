export const joinedPlayers = new Set();
export const playerRoles = new Map();
export const alivePlayers = new Set();

export let gameRunning = false;
export const setGameRunning = (value) => {
  gameRunning = value;
};

export let currentPhase = "PRE_GAME";
export const setPhase = (phase) => { currentPhase = phase; };

export let nightActions = {
  mafiaTarget: null,
  doctorTarget: null
};

export let votes = new Map();

// Track current game id for per-game stats snapshots
export let currentGameId = null;
export const setCurrentGameId = (id) => { currentGameId = id; };

export function resetGame() {
  joinedPlayers.clear();
  playerRoles.clear();
  alivePlayers.clear();

  gameRunning = false;
  currentPhase = "PRE_GAME";

  nightActions = { mafiaTarget: null, doctorTarget: null };
  votes.clear();

  currentGameId = null;
}