export const joinedPlayers = new Set();
export const playerRoles = new Map();
export const alivePlayers = new Set();

export let gameRunning = false;

export const setGameRunning = (value) => {
  gameRunning = value;
};


export let currentPhase = "PRE_GAME";
export let nightActions = {
  mafiaTarget: null,
  doctorTarget: null
};

export let votes = new Map();

export function resetGame() {
  joinedPlayers.clear();
  playerRoles.clear();
  alivePlayers.clear();
  currentPhase = "PRE_GAME";
  nightActions = { mafiaTarget: null, doctorTarget: null };
  votes.clear();
}

export const setPhase = (phase) => { currentPhase = phase; };