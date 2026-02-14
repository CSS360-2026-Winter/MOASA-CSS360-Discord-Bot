import { expect } from "chai";
import { joinedPlayers, playerRoles, resetGame } from "../src/helpers/gameState.js";

describe("gameState.resetGame", () => {
  it("clears joinedPlayers and playerRoles", () => {
    // Arrange: put some fake data in state
    joinedPlayers.add("user1");
    joinedPlayers.add("user2");
    playerRoles.set("user1", "Mafia");
    playerRoles.set("user2", "Detective");

    // Act
    resetGame();

    // Assert
    expect(joinedPlayers.size).to.equal(0);
    expect(playerRoles.size).to.equal(0);
  });
});
