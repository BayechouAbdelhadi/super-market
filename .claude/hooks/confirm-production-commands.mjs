// PreToolUse (Bash): production (the Coolify VPS, its Supabase database) is reached with ssh, psql and docker.
// Those commands always need the user's explicit go-ahead, whatever the permission mode.
import { readFileSync } from "node:fs";

// Matched in command position only (start, after ; & | ( or sudo), so `grep ssh lib` is not caught
const COMMAND_START = String.raw`(^|[;&|(]|\bsudo)\s*`;
const PRODUCTION_COMMAND = new RegExp(
  `${COMMAND_START}((ssh|scp|rsync|psql|pg_dump|pg_restore)(\\s|$)|docker\\s+(exec|compose|run|rm|stop|restart)\\b)`,
);

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input.tool_input?.command ?? "";

if (PRODUCTION_COMMAND.test(command)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: "This command can reach the production server or database (docs/deployment-coolify.md).",
      },
    }),
  );
}
