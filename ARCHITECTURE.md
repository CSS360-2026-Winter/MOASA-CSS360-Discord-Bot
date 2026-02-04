## Mafia Game Bot Architecture

Introduction

This document outlines the architecture of the Mafia game bot. The bot facilitates a multiplayer Mafia game experience on Discord, managing game state, player roles, and the flow of day/night phases.

System Overview

The bot interacts with Discord's API to provide users with game commands and maintain game logic. Players interact with the bot through a series of commands like `/join`, `/role`, `/start`, and `/vote`.

Activity Diagram – Mafia Game Flow

This activity diagram illustrates the control flow of the Mafia game from player recruitment through game termination. It begins with users joining the game via the `/join` command, followed by a timed recruitment phase and role assignment. The game then alternates between night and day phases, resolving role-based actions, player discussions, voting, and eliminations.
After each cycle, the bot evaluates win conditions and either continues the game loop or announces a winner and ends the game.

![Mafia Game Activity Diagram](../MOASA-CSS360-Discord-Bot/src/images/Activity-Diagram.png)

---

## Mafia Game Engine: State Management & Game Logic
Overview
The Mafia game is the core functionality of the MOASA bot. It utilizes a Stateful Event-Driven Architecture, where the bot tracks the game's progression (Day/Night phases) and player statuses in real-time.

Feature Description
The game manages complex interactions including role assignment, secret voting, and win-condition checks. Unlike simple one-off commands, the Mafia game requires a persistent Game State to transition between different phases based on user input and timed events.

Data Flow
Game Initialization: Users use /start to trigger the game logic.

Role Assignment: The bot assigns roles (Mafia, Doctor, Citizen) and updates the Datastore.

Phase Cycle:

Night Phase: Mafia and Doctor submit actions via DMs or private channels.

Day Phase: Players discuss and vote via slash commands in the public channel.

Processing: The Decision Logic checks if the voting threshold is met.

State Update: Upon execution or murder, the bot updates the player's "Alive" status in the Datastore.

Win Condition Check: After each phase, the bot evaluates if the number of Mafia members equals or exceeds the number of Citizens.

Architecture Diagram (System Context & Flow)
The Mafia logic follows a circular flow where user interactions continuously update the internal Game State Storage, which then determines the next outcome displayed to the Discord channel.

![Mafia Game Data Flow Diagram](../MOASA-CSS360-Discord-Bot/src/images/datadiagram.png)

Relevant Code
src/commands/mafia.js: Main command handler for game flow.

src/logic/gameState.js: In-memory object/store managing player lists and roles.

src/logic/evaluator.js: Logic for determining winners and processing vote results.

Architectural Significance
The Mafia game engine highlights the bot's ability to handle Asynchronous State Transitions.

Modularity: The game logic is decoupled from the Discord API wrapper, allowing for easier debugging of game rules.

Persistence: By using a dedicated state storage, the bot can maintain game integrity even when multiple events (like simultaneous votes) occur.