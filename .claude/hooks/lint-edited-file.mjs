// PostToolUse (Edit|Write|MultiEdit): lints the file Claude just changed, so a rule from AGENTS.md that ESLint
// enforces (theme colors, viewport units…) is fixed right away. Exit 2 hands the errors back to Claude.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const LINTED_FILE = /\.(ts|tsx|mts|mjs|js|jsx)$/;

const input = JSON.parse(readFileSync(0, "utf8"));
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
const filePath = input.tool_input?.file_path;

if (!filePath || !LINTED_FILE.test(filePath) || !existsSync(filePath)) process.exit(0);
const relative = path.relative(projectDir, filePath);
if (relative.startsWith("..") || path.isAbsolute(relative)) process.exit(0);

const eslint = path.join(projectDir, "node_modules", ".bin", "eslint");
if (!existsSync(eslint)) process.exit(0);

const result = spawnSync(eslint, ["--no-warn-ignored", relative], { cwd: projectDir, encoding: "utf8" });
if (result.status === 0) process.exit(0);

process.stderr.write(`ESLint found problems in ${relative} (AGENTS.md rules). Fix them:\n${result.stdout}${result.stderr}`);
process.exit(2);
