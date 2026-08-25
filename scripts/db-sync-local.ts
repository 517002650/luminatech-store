/**
 * Pull production (Neon) data into local SQLite for offline work.
 *
 * Usage (PowerShell):
 *   $env:BACKUP_DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"
 *   npm run db:sync:local
 *
 * Steps:
 *   1. Generate Postgres client → backup Neon to backups/latest.json
 *   2. Generate SQLite client → push local schema → restore into prisma/dev.db
 */
import { spawnSync } from "child_process";
import path from "path";
import { config } from "dotenv";

config();

const neonUrl = process.env.BACKUP_DATABASE_URL;
if (!neonUrl || !neonUrl.startsWith("postgres")) {
  console.error(
    [
      "Set BACKUP_DATABASE_URL to your Neon PostgreSQL connection string first.",
      "",
      "PowerShell example:",
      '  $env:BACKUP_DATABASE_URL="postgresql://USER:PASS@ep-xxxx.neon.tech/neondb?sslmode=require"',
      "  npm run db:sync:local",
    ].join("\n"),
  );
  process.exit(1);
}

const root = process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command: string, args: string[], env: Record<string, string> = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const localUrl = "file:./prisma/dev.db";

console.log("1/4 Generate Prisma client for PostgreSQL (Neon)…");
run(npx, ["prisma", "generate", "--schema=prisma/schema.prisma"], {
  DATABASE_URL: neonUrl,
});

console.log("2/4 Backup Neon → backups/latest.json…");
run(npx, ["tsx", path.join("scripts", "db-backup.ts")], {
  BACKUP_DATABASE_URL: neonUrl,
  DATABASE_URL: neonUrl,
});

console.log("3/4 Prepare local SQLite schema…");
run(npx, ["prisma", "generate", "--schema=prisma/schema.local.prisma"], {
  DATABASE_URL: localUrl,
});
run(npx, ["prisma", "db", "push", "--schema=prisma/schema.local.prisma", "--skip-generate"], {
  DATABASE_URL: localUrl,
});

console.log("4/4 Restore backup into local SQLite…");
run(
  npx,
  ["tsx", path.join("scripts", "db-restore.ts"), "backups/latest.json", "--yes"],
  {
    RESTORE_DATABASE_URL: localUrl,
    DATABASE_URL: localUrl,
    RESTORE_YES: "1",
  },
);

console.log(
  [
    "",
    "Done. Local DB synced from Neon:",
    "  prisma/dev.db  (and backups/latest.json)",
    "",
    "Start local app with:",
    "  npm run dev",
    "",
    "Note: .env should keep DATABASE_URL=file:./prisma/dev.db for local work.",
  ].join("\n"),
);
