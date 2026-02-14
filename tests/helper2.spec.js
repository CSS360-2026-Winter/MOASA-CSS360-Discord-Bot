import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { loadCommands } from "../src/helpers/loadCommands.js";

describe("loadCommands", () => {
  it("loads valid command files into client.commands", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "commands-"));

    // Create a valid command file (CJS because loadCommands uses require)
    fs.writeFileSync(
      path.join(tempDir, "ping.js"),
      'module.exports = { data: { name: "ping" }, execute() {} };'
    );

    const client = { commands: new Map() };

    loadCommands(client, tempDir);

    expect(client.commands.has("ping")).to.equal(true);
    expect(client.commands.get("ping")).to.have.property("execute");
  });
});
