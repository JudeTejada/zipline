import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_BASE = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const CONFIG_DIR = join(CONFIG_BASE, "zipline");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

type Config = {
  token?: string;
};

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Config;
    return parsed || {};
  } catch {
    return {};
  }
}

export async function saveToken(token: string): Promise<void> {
  const config: Config = { token };
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export { CONFIG_PATH };
