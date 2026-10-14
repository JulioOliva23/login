import { getGitStatus } from "../../scripts/git-status.js";

export default async function gitStatusPlugin() {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "bash") return;

      const command = output.args?.command ?? input.args?.command ?? "";
      if (!/^(?:git status|npm test)(?:\s|$)/.test(command.trim())) return;

      const gitStatus = await getGitStatus();
      output.metadata = {
        ...(output.metadata ?? {}),
        gitStatus,
      };
    },
  };
}
