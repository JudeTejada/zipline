import { collectAllFiles, GitHubAuthOptions, GitHubContent, GitHubURLInfo } from "./github";
import { writeZip, ZippableFile } from "./zipper";

export interface DownloadProgress {
  downloaded: number;
  total: number;
  currentFile?: string;
}

export interface DownloadOptions {
  concurrency?: number;
  onProgress?: (progress: DownloadProgress) => void;
  token?: string;
}

async function downloadFileContent(
  file: GitHubContent,
  auth?: GitHubAuthOptions,
): Promise<Uint8Array> {
  if (!file.download_url) {
    throw new Error(`No download URL available for ${file.path}`);
  }

  const headers: Record<string, string> = {};
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  const response = await fetch(file.download_url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download ${file.path}: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    const schedule = () => {
      if (nextIndex >= items.length && active === 0) {
        resolve(results);
        return;
      }

      while (active < limit && nextIndex < items.length) {
        const current = nextIndex++;
        active++;

        worker(items[current], current)
          .then((result) => {
            results[current] = result;
          })
          .catch(reject)
          .finally(() => {
            active--;
            schedule();
          });
      }
    };

    schedule();
  });
}

export async function downloadAndZip(
  info: GitHubURLInfo,
  outputPath: string,
  options?: DownloadOptions,
): Promise<{ fileCount: number }> {
  const concurrency = options?.concurrency ?? 8;
  const auth: GitHubAuthOptions | undefined = options?.token
    ? { token: options.token }
    : undefined;
  const files = await collectAllFiles(info, auth);

  if (files.length === 0) {
    throw new Error("No files were found at the provided path");
  }

  options?.onProgress?.({
    downloaded: 0,
    total: files.length,
    currentFile: undefined,
  });

  let completed = 0;
  const downloaded: ZippableFile[] = await runWithConcurrency(
    files,
    concurrency,
    async (file) => {
      const content = await downloadFileContent(file, auth);
      completed += 1;
      options?.onProgress?.({
        downloaded: completed,
        total: files.length,
        currentFile: file.path,
      });
      return { path: file.path, content };
    },
  );

  await writeZip(downloaded, outputPath);

  return { fileCount: files.length };
}
