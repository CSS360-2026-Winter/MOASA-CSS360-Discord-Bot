export const assignRoles = (playerIds) => {
  const players = [...playerIds];

  // Shuffle players
  players.sort(() => Math.random() - 0.5);

  const roles = new Map();

  roles.set(players[0], "Mafia");
  roles.set(players[1], "Doctor");

  if(players.length >= 3){
    roles.set(players[2], "Fortune Teller");
  }

  for (let i = 3; i < players.length; i++) {
    roles.set(players[i], "Civilian");
  }

  return roles;
};
