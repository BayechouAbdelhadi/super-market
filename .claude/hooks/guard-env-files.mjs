// PreToolUse (Edit|Write|MultiEdit): .env files hold the Supabase service-role key, the Brevo key and
// AUTH_TOKEN_SECRET. Claude never writes them; .env.example (names only, no values) stays editable.
import { readFileSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const name = path.basename(input.tool_input?.file_path ?? "");

if (/^\.env(\..+)?$/.test(name) && name !== ".env.example") {
  process.stderr.write(
    `Blocked: ${name} holds secrets and is edited by hand only. Tell the user which variable to set; document new names in .env.example.`,
  );
  process.exit(2);
}
