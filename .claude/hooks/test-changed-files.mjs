// Stop: before Claude hands back, runs the Vitest tests related to the TypeScript files changed in the working tree.
// Exit 2 hands the failures back so Claude fixes them. Runs once per stop (stop_hook_active), so it never loops.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const TESTED_FILE = /^(app|components|lib|tests)\/.+\.(ts|tsx)$/;

const input = JSON.parse(readFileSync(0, "utf8"));
if (input.stop_hook_active) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
const git = (args) => spawnSync("git", args, { cwd: projectDir, encoding: "utf8" }).stdout ?? "";

const changed = [
  ...git(["diff", "--name-only", "HEAD"]).split("\n"),
  ...git(["ls-files", "--others", "--exclude-standard"]).split("\n"),
].filter((file) => TESTED_FILE.test(file) && existsSync(path.join(projectDir, file)));

if (changed.length === 0) process.exit(0);

const vitest = path.join(projectDir, "node_modules", ".bin", "vitest");
if (!existsSync(vitest)) process.exit(0);

const result = spawnSync(vitest, ["related", "--run", "--passWithNoTests", ...new Set(changed)], {
  cwd: projectDir,
  encoding: "utf8",
});
if (result.status === 0) process.exit(0);

const output = `${result.stdout}${result.stderr}`.split("\n").slice(-60).join("\n");
process.stderr.write(`Tests related to the changed files fail. Fix them, or tell the user why:\n${output}`);
process.exit(2);
