# MOASA CSS360 Discord Bot

## Project Overview
This repository is a group project for CSS360.
The team is using this repository to set up collaboration tools and infrastructure for a Discord bot project.
The bot simulates a fully interactive multiplayer game of Mafia with automated phase management, role logic, and persistent stat tracking.

## Current Project Status
- Group repository and individual forks created
- GitHub Projects (Kanban board) set up
- Discord deployment server created
- Discord test servers created
- Project is currently in the planning and setup phase

## Team
- Team Name: MOASA
- Members:
  - Mini
  - Oliver
  - Alexandra
  - Sari
  - Ayad
 
## Sprint 1 (Version 1.0)

Sprint 1 focused on setting up a working Discord bot and implementing initial features.

Completed features include:
- Welcome message with a meme when a new user joins the server
- Initial setup for the Mafia game
- Defined Mafia game rules
- /join command for players to join a game
- Direct messages sent to players when enough users have joined


## Sprint 2 (Version2.0)

Sprint 2 focused on completing the core Mafia game functionality while improving interactivity, visual feedback, and overall game stability and fairness.

Completed features include:
- Implemented a real-time countdown timer during the Night phase
- Implemented a real-time countdown timer during the voting phase
- Added role-specific visuals for Doctor saves and voting actions
- Prevented duplicate Night phase images on reset
- Added phase-specific images for Night, Morning, Kill, Win, and Lose states
- Integrated role-specific images into the /role command

Game Integrity & Fair Play Enhancements:
- Prevented `/join` from resetting or interfering with an active match
- Added centralized `gameRunning` state tracking
- Dead players can no longer send messages during active gameplay
- Dead players receive a private notification if they attempt to speak
- Night victims receive a private DM revealing the Mafia member responsible

## Course Context
This project is part of CSS360 and is under active development.
The README will be updated as the project design becomes clearer.

## Commands

### Mafia Game
- `/join` Join the Mafia game (starts recruitment if no game is active)
- `/role` View your Mafia role (private)
- `/vote <user>` Vote to eliminate a player (Day phase only)
- `/kill <user>` Mafia: eliminate a player (Night phase only)
- `/save <user>` Doctor: protect a player (Night phase only)
- `/mycommands` List commands for your role
- `/reset` Reset the Mafia game (admin only)
- `/mafia role` View all roles in the Mafia game
- `/rules` View the rules of the Mafia game
- `/stats` Show player stats across all games and recent games

### Fun
- `/meme` Get a meme

## Game State Management

The bot uses a centralized game state system to ensure match integrity.

Key protections include:
- Active game locking to prevent mid-match resets
- Phase tracking (Pre-Game, Night, Day, Ended)
- Alive player tracking to enforce communication restrictions
- Automatic cleanup and state reset after win conditions

These systems ensure a stable multiplayer experience and prevent state corruption during gameplay.

## Stats Tracking
The bot tracks lifetime player stats across matches and stores them persistently in:
- data/stats.json

Recent games are recorded using per-game snapshots so /stats can show what happened in the last matches.

Note:
- The data/ folder is runtime output and should not be committed to git. Add `data/` to .gitignore.