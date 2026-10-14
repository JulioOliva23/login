import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getGitStatus(cwd = process.cwd()) {
  const { stdout } = await execFileAsync(
    "git",
    ["status", "--short", "--branch"],
    { cwd },
  );

  return stdout.trim();
}
