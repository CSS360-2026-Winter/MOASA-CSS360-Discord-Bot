import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "stats.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, "{}", "utf8");
}

function load() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function save(db) {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(db, null, 2), "utf8");
}

function ensurePlayer(db, userId) {
  if (!db[userId]) {
    db[userId] = {
      gamesPlayed: 0,
      timesVoted: 0,
      timesVotedAgainst: 0,
      timesVotedOut: 0,
      timesKilled: 0,
      killsAsMafia: 0,
      savesAsDoctor: 0,
      roleMafia: 0,
      roleDoctor: 0,
      roleCivilian: 0
    };
  }
  return db[userId];
}

function ensureMeta(db) {
  if (!db._meta) db._meta = {};
  if (!db._meta.games) db._meta.games = [];            // finished games (most recent last)
  if (!db._meta.activeGames) db._meta.activeGames = {}; // gameId -> baseline snapshots
}

function cloneStatObj(s) {
  return {
    gamesPlayed: s.gamesPlayed ?? 0,
    timesVoted: s.timesVoted ?? 0,
    timesVotedAgainst: s.timesVotedAgainst ?? 0,
    timesVotedOut: s.timesVotedOut ?? 0,
    timesKilled: s.timesKilled ?? 0,
    killsAsMafia: s.killsAsMafia ?? 0,
    savesAsDoctor: s.savesAsDoctor ?? 0,
    roleMafia: s.roleMafia ?? 0,
    roleDoctor: s.roleDoctor ?? 0,
    roleCivilian: s.roleCivilian ?? 0
  };
}

function diffStats(after, before) {
  const out = {};
  for (const k of Object.keys(cloneStatObj(after))) {
    out[k] = (after[k] ?? 0) - (before[k] ?? 0);
  }
  return out;
}

export function incStat(userId, key, amount = 1) {
  const db = load();
  ensureMeta(db);
  const p = ensurePlayer(db, userId);
  p[key] = (p[key] ?? 0) + amount;
  save(db);
}

export function bulkEnsure(userIds) {
  const db = load();
  ensureMeta(db);
  for (const id of userIds) ensurePlayer(db, id);
  save(db);
}

export function getAllStats() {
  const db = load();
  ensureMeta(db);
  return db;
}

// Per-game snapshot start
export function beginGameSnapshot(gameId, playerIds) {
  const db = load();
  ensureMeta(db);

  const baseline = {};
  for (const id of playerIds) {
    const p = ensurePlayer(db, id);
    baseline[id] = cloneStatObj(p);
  }

  db._meta.activeGames[gameId] = {
    startedAt: new Date().toISOString(),
    playerIds: Array.from(playerIds),
    baseline
  };

  save(db);
}

// Per-game snapshot end (stores last 10 games)
export function endGameSnapshot(gameId) {
  const db = load();
  ensureMeta(db);

  const active = db._meta.activeGames[gameId];
  if (!active) return;

  const perPlayer = {};
  for (const id of active.playerIds) {
    const p = ensurePlayer(db, id);
    const after = cloneStatObj(p);
    const before = active.baseline[id] || cloneStatObj({});
    perPlayer[id] = diffStats(after, before);
  }

  db._meta.games.push({
    gameId,
    startedAt: active.startedAt,
    endedAt: new Date().toISOString(),
    players: perPlayer
  });

  // keep only last 10 games
  if (db._meta.games.length > 10) {
    db._meta.games = db._meta.games.slice(db._meta.games.length - 10);
  }

  delete db._meta.activeGames[gameId];
  save(db);
}

// If a match dies mid-run, do not record it as a "finished game"
export function cancelGameSnapshot(gameId) {
  const db = load();
  ensureMeta(db);

  if (db._meta.activeGames && db._meta.activeGames[gameId]) {
    delete db._meta.activeGames[gameId];
    save(db);
  }
}

export function getRecentGames(limit = 2) {
  const db = load();
  ensureMeta(db);
  const games = db._meta.games || [];
  return games.slice(Math.max(0, games.length - limit));
}