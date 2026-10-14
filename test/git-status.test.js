import test from "node:test";
import assert from "node:assert/strict";
import { getGitStatus } from "../scripts/git-status.js";
import gitStatusPlugin from "../.opencode/hooks/git-status.js";

test("git status devuelve texto", async () => {
  assert.equal(typeof await getGitStatus(), "string");
});

test("git status muestra la rama main", async () => {
  assert.match(await getGitStatus(), /^## main(?:\.\.\.origin\/main)?$/m);
});

test("git status se ejecuta dentro de un repositorio", async () => {
  await assert.doesNotReject(() => getGitStatus());
});

test("git status incluye el formato corto", async () => {
  const status = await getGitStatus();

  assert.match(status, /^## /m);
});

test("el hook añade git status a los metadatos", async () => {
  const hooks = await gitStatusPlugin();
  const output = { args: { command: "git status" } };

  await hooks["tool.execute.after"]({ tool: "bash" }, output);

  assert.match(output.metadata.gitStatus, /^## main(?:\.\.\.origin\/main)?$/m);
});
