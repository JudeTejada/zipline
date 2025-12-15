export interface GitHubURLInfo {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
  url: string;
}

export interface GitHubAuthOptions {
  token?: string;
}

function buildHeaders(options?: GitHubAuthOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "zipline-cli",
    Accept: "application/vnd.github.v3+json",
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  return headers;
}

export function parseGithubURL(rawURL: string): GitHubURLInfo {
  let parsed: URL;
  try {
    parsed = new URL(rawURL);
  } catch (error) {
    throw new Error(`Invalid URL: ${String(error)}`);
  }

  if (parsed.hostname !== "github.com") {
    throw new Error("URL must point to github.com");
  }

  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 4 || parts[2] !== "tree") {
    throw new Error(
      "Unsupported GitHub folder URL. Expected format: /owner/repo/tree/branch/path",
    );
  }

  return {
    owner: decodeURIComponent(parts[0]),
    repo: decodeURIComponent(parts[1]),
    branch: decodeURIComponent(parts[3]),
    path: parts.slice(4).map(decodeURIComponent).join("/"),
  };
}

export function buildContentsURL(info: GitHubURLInfo, pathOverride?: string): string {
  const targetPath = pathOverride ?? info.path;
  const encodedPath = targetPath
    ? `/${targetPath.split("/").map(encodeURIComponent).join("/")}`
    : "";

  return `https://api.github.com/repos/${encodeURIComponent(info.owner)}/${encodeURIComponent(
    info.repo,
  )}/contents${encodedPath}?ref=${encodeURIComponent(info.branch)}`;
}

export async function fetchContents(
  apiURL: string,
  options?: GitHubAuthOptions,
): Promise<GitHubContent[]> {
  const response = await fetch(apiURL, { headers: buildHeaders(options) });
  if (!response.ok) {
    throw new Error(`GitHub API responded with ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GitHubContent[] | Record<string, unknown>;
  if (!Array.isArray(data)) {
    throw new Error("GitHub API response was not a directory listing");
  }

  return data;
}

export async function collectAllFiles(
  info: GitHubURLInfo,
  options?: GitHubAuthOptions,
): Promise<GitHubContent[]> {
  const startURL = buildContentsURL(info);
  return collectRecursive(startURL, options);
}

async function collectRecursive(
  apiURL: string,
  options?: GitHubAuthOptions,
): Promise<GitHubContent[]> {
  const items = await fetchContents(apiURL, options);
  const files: GitHubContent[] = [];

  for (const item of items) {
    if (item.type === "file") {
      files.push(item);
    } else if (item.type === "dir" && item.url) {
      const nested = await collectRecursive(item.url, options);
      files.push(...nested);
    }
  }

  return files;
}
