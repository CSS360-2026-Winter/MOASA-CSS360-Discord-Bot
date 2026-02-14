# Code Analysis Report(1)

## Minheekim – Code Smells & Technical Debt

(1) Code Smells & Technical Debt

## Issue 1: Hardcoded Role Definitions in mafiaRole.js

Problem: All role data (name, faction, description, win condition) is stored as hardcoded objects inside the command file.

Impact: Changing game rules requires modifying source code and redeploying the bot.
This also prevents reuse of role data across other features such as help commands or game logic validation.

Recommendation: Move role definitions into a dedicated configuration or data module such as:

/data/roles.js
Then import it wherever needed.

## Issue 2: Mixed Responsibilities in Command Files

!(Seen in mafiaRole.js and role.js)!

Problem:
Command files handle multiple responsibilities: game logic lookup, formatting output, UI response creation, business rules

Impact: Commands become difficult to test and modify. Any change in game rules risks breaking message formatting.

Recommendation
Split into layers:
service layer (game logic)
presentation layer (Discord reply formatting)

## Issue 3: Global Mutable Game State in gameState.js Usage

!(Observed in role.js)!

const role = playerRoles.get(interaction.user.id);

Problem: Game state is accessed directly from multiple modules without controlled access.

Impact: State corruption may occur when multiple commands modify or read the state simultaneously.
This makes debugging inconsistent game behavior difficult.

Recommendation: Encapsulate game state behind functions or a class:

getPlayerRole(userId)
setPlayerRole(userId, role)

### User Story

As a developer, I want game data and state logic separated from command handlers so that new features can be added without breaking existing gameplay.

# Code Analysis Report(2)

(2) Cyclomatic Complexity Assessment

1. rules.js

execute()
Branching: CC = 1

explanation: 
This function only builds an embed and replies to the interaction. It follows a single linear execution path and contains no decisions or loops. Therefore the risk of logic errors is minimal.

2. roleCommands.js (mycommands)

execute()
Branching: if (!role) → 1 , CC = 2

explanation:
The function checks whether the user has a role and responds accordingly. This is a simple guard condition and does not significantly increase complexity.

3. role.js

execute()

Branching: if (!role) → 1
ROLE_COMMANDS[role] || "Good luck!" → 1 (logical branch)
CC = 3

explanation:
This method includes a validation branch and a fallback behavior. It introduces slightly more complexity but remains easy to understand and maintain.

4. mafiaRoles.js

execute()

Branching: for (const role of Object.values(ROLES)) → 1, CC = 2

explanation:
The loop iterates over predefined roles to populate the embed. Although iterative, the behavior is deterministic and low risk.

5. join.js
execute()

Branching count:

Code	Count
if (joinOpen)	1
if (joinedPlayers.has(userId))	1
while (remaining > 0)	1
if (!joinOpen) break	1
try/catch	1
if (finalSize < 3)	1
else	1

CC = 1 + 7 = 8

generateJoinText()

Branching:
CC = 1

Complexity Interpretation
File:    rules.js    roleCommands.js    role.js    mafiaRoles.js    join.js
                	
Function: execute    execute            execute     execute         execute          
                
CC:       1           2                 3           2               8

Risk:     trivial     very low          low         very low        moderate

explanation:
The majority of the bot’s commands have very low cyclomatic complexity, indicating clear and maintainable logic.However, join.js has significantly higher complexity because it manages game state, countdown timing, player validation, and role assignment in a single method. This increases the likelihood of edge-case bugs such as race conditions, inconsistent state, or timing issues.

Refactoring Recommendation

The join command should be refactored into smaller functions:
player validation
countdown timer
UI update logic
game start logic
Separating these responsibilities would reduce complexity and improve maintainability.


# Code Analysis Report(3)
## Sari Ando – Fuzz Testing Analysis
(3) Fuzz Testing Analysis

This report presents three representative issues discovered during fuzz testing.

## Method
I implemented a custom fuzz tester that directly invokes the bot’s interaction handler without Discord.  
The fuzzer generates randomized command names and user IDs and repeatedly calls the command execution pipeline.
The goal is to explore execution paths that normal user interaction may not reach.

---

## Issue 1: Guild Assumption Crash (Null Reference)
### Description
The `join` command assumes the guild member cache always exists.
The command accesses `guild.members.cache` without verifying that the interaction originated from a guild.
![Join crash](images/fuzz-join-null.png)

### Impact
The bot might crash when:
- command is executed in DMs
- Discord API delay
- permissions incomplete

### To Fix
Use this code: 
if (!interaction.guild || !interaction.guild.members) {
  await interaction.reply({
    content: "Server data is not available yet. Try again in a moment.",
    ephemeral: true
  });
  return;
}


## Issue 2: Asynchronous Exception Propagation
### Description
The error occurs inside an awaited async command execution and propagates through the promise queue.
Observed stack trace shows propagation through processTicksAndRejections.
![Async crash](images/fuzz-async-propagation.png)

### Impact
This may cause:
- Terminate the process
- Brak the ongoing games

### To Fix
Add structured validation before async operations and isolate state mutation from message generation.


## Issue 3: Failure Amplification
### Description
Once a command throws an exception, the global interaction handler responds and execution flow stops.
Subsequent command logic in the same runtime context becomes unreachable.
![Error count](images/fuzz-error-count.png)

### Impact
This may cause: 
- A single faulty command can place the bot in a degraded state where further actions cannot be validated or processed.
- This significantly reduces fault tolerance.

### To Fix
Use this code:
try {
  await command.execute(interaction);
} catch (err) {
  logError(err);
  await safeErrorReply(interaction);
}
resetTransientState();

## Conclusion
From this tester, we were able to reveale the runtime reliability and architectural robustness issues.  
The bot is currently icomplete and still lacks sufficient error handling.
Even a single malformed interaction can cause unstable behavior or halt further execution paths.  
Stability and fault tolerance can be improved by adding validation guards and isolating command execution. 