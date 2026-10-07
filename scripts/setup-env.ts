// Creates .env.local from .env.example and fills ROUND_SECRET with a random
// key. Never overwrites a value that is already set.
//
// Usage: pnpm env:setup

import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT_DIR } from "./lib/catalog-file";

const ENV_LOCAL = path.join(ROOT_DIR, ".env.local");
const ENV_EXAMPLE = path.join(ROOT_DIR, ".env.example");

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function main() {
  const existing = await readText(ENV_LOCAL);
  let text = existing ?? (await readFile(ENV_EXAMPLE, "utf8"));

  const secret = randomBytes(32).toString("base64");
  const line = /^ROUND_SECRET=(.*)$/m.exec(text);
  if (line && line[1].trim()) {
    console.log(".env.local already has ROUND_SECRET; nothing to do.");
    return;
  }
  text = line
    ? text.replace(/^ROUND_SECRET=.*$/m, `ROUND_SECRET=${secret}`)
    : `${text.trimEnd()}\nROUND_SECRET=${secret}\n`;

  await writeFile(ENV_LOCAL, text);
  console.log(`${existing === null ? "Created" : "Updated"} .env.local with a new ROUND_SECRET.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
