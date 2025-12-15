import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";

const GH_CONFIG_DIR = process.env.GH_CONFIG_DIR || join(homedir(), ".config", "gh");
const GH_CONFIG_PATH =
  process.env.GH_HOSTS_CONFIG || join(GH_CONFIG_DIR, "hosts.yml");

export async function loadGhCliToken(): Promise<string | undefined> {
  try {
    const raw = await readFile(GH_CONFIG_PATH, "utf8");
    const data = parse(raw) as Record<
      string,
      { oauth_token?: string; user?: string; expiry?: string }
    >;

    const githubCom = data?.["github.com"];
    if (githubCom?.oauth_token) {
      return githubCom.oauth_token as string;
    }
  } catch {
    // ignore file errors; fall through to CLI fallback
  }

  // Fallback: try `gh auth status --show-token`
  try {
    const token = await runGhAuthStatus();
    if (token) return token;
  } catch {
    // ignore, will return undefined
  }

  return undefined;
}

export { GH_CONFIG_PATH };

async function runGhAuthStatus(): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    execFile(
      "gh",
      ["auth", "status", "--show-token", "--hostname", "github.com"],
      { env: process.env, timeout: 5000 },
      (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        const match = stdout.match(/Token:\s*([a-zA-Z0-9_]+)/);
        if (match?.[1]) {
          resolve(match[1]);
        } else {
          resolve(undefined);
        }
      },
    );
  });
}
