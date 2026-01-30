// helpers/gameState.js
export const joinedPlayers = new Set();
export const playerRoles = new Map();
export let gameActive = false;

export function resetGame() {
  joinedPlayers.clear();
  playerRoles.clear();
  gameActive = false;
}
