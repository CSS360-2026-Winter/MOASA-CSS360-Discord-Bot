# MOASA CSS360 Discord Bot

## Project Overview
MOASA is a fully interactive, automated Mafia game bot. It manages complex state transitions, role-specific logic, persistent data tracking, and immersive storytelling to bring the classic social deduction game to Discord.

## Current Project Status: COMPLETED (Winter 2026)
- Core Engine: Fully functional Night/Day cycle with automated phase resolution.
- Role Logic: Dynamic assignment for Mafia, Doctor, Fortune Teller, and Civilian roles.
- Persistence: Full stat tracking with per-game snapshots and lifetime leaderboards.
- User Experience: Immersive visuals, randomized narrative stories, and robust error handling.

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


## Sprint 3 (Version 2.1)

Sprint 3 focuses on modernizing the user experience and expanding gameplay depth through new interaction methods and advanced role logic.

Completed features include:
- Added the **Fortune Teller** role (Civilian faction).
- Implemented the `/divine` command, allowing players to investigate a target's role during the Night phase.
- Integrated divination success tracking into the global scoring and stats system.
- Implemented a dynamic **Day Counter** (e.g., "DAY 1", "DAY 2") to help players track game progress.
- Implemented randomized **Death & Save stories** to provide unique flavor text for every morning phase.
- Implemented an automated role displaying system where users receive a DM once the game starts, displaying their role, custom role-card images, and commands.
- Implemented a button-based lobby for game recruitment
- Implemented a button-based voting system during the day phase
- Improved player clarity during the voting phase by displaying a real-time list of surviving players (aliveList).
- Added validation to prevent duplicate player joins, ensuring users cannot join the same game multiple times.

## Commands

### Mafia Game
- `/join` Start the Mafia game recruitment lobby (subsequent players join using buttons)
- `/role` View your Mafia role (private)
- `/kill <user>` Mafia: eliminate a player (Night phase only)
- `/save <user>` Doctor: protect a player (Night phase only)
- `/divine <user>` Fortune Teller: Investigate a player's role (Night phase only).
- `/mycommands` List commands for your role
- `/reset` Reset the Mafia game (admin only)
- `/mafia role` View all roles in the Mafia game
- `/rules` View the rules of the Mafia game
- `/stats` Show player stats across all games and recent games
- `/players` command so users can view all current players and their status
- `/fortune` command to provide classic-style random fortune cookie messages for extra flavor and immersion

### Fun
- `/meme` Get a meme

## Buttons

### Recruitment
- After a player starts a lobby using `/join`, subsequent players click the "Join Game" button to join the lobby

### Voting
- During the day phase, players vote for the Mafia suspect by clicking the suspect's button

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


### End of Project Note

Developed for CSS360 Software Engineering. Special thanks to Dr. Champion for the guidance and support throughout the software lifecycle!
