/**
 * Writes config/theme.schema.json from the validation rules in lib/theme, so editors
 * autocomplete and check config/theme.json. Run after changing those rules:
 *   npm run theme:schema
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { themeJsonSchema } from "../lib/theme";

const target = join(process.cwd(), "config", "theme.schema.json");
writeFileSync(target, JSON.stringify(themeJsonSchema(), null, 2) + "\n");
console.log(`Wrote ${target}`);
