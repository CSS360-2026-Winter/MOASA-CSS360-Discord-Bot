import { expect } from "chai";
import fs from "fs";
import os from "os";
import path from "path";
import { loadCommands } from "../src/helpers/loadCommands.js";

describe("loadCommands warnings", () => {
  it('warns and skips files missing "data.name"', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "commands-"));

    // Invalid command: missing data.name
    fs.writeFileSync(
      path.join(tempDir, "bad.js"),
      "module.exports = { data: {}, execute() {} };"
    );

    const client = { commands: new Map() };

    // Capture console.warn
    const originalWarn = console.warn;
    const warnCalls = [];
    console.warn = (...args) => warnCalls.push(args.join(" "));

    try {
      loadCommands(client, tempDir);
    } finally {
      console.warn = originalWarn;
    }

    expect(client.commands.size).to.equal(0);
    expect(warnCalls.length).to.be.greaterThan(0);
    expect(warnCalls.join("\\n")).to.include('missing "data.name"');
  });
});
