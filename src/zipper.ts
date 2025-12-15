import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { zipSync } from "fflate";

export interface ZippableFile {
  path: string;
  content: Uint8Array;
}

export async function writeZip(files: ZippableFile[], outputPath: string): Promise<void> {
  const targetDir = dirname(outputPath);
  if (targetDir && targetDir !== ".") {
    await mkdir(targetDir, { recursive: true });
  }

  const zipped = zipSync(
    Object.fromEntries(files.map((file) => [file.path, file.content])),
    { level: 6 },
  );

  await writeFile(outputPath, Buffer.from(zipped));
}
