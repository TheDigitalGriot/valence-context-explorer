import * as path from "path";
import * as fs from "fs";

export interface PathContainmentResult {
  contained: boolean;
  resolvedPath: string;
  reason?: string;
}

function normalizePath(p: string): string {
  let resolved = path.resolve(p);
  // Case-insensitive on Windows
  if (process.platform === "win32") {
    resolved = resolved.toLowerCase();
  }
  // Remove trailing separator
  if (resolved.endsWith(path.sep) && resolved !== path.sep) {
    resolved = resolved.slice(0, -1);
  }
  return resolved;
}

function safeRealpath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    // File may not exist yet — resolve parent
    const parent = path.dirname(p);
    try {
      return path.join(fs.realpathSync(parent), path.basename(p));
    } catch {
      return path.resolve(p);
    }
  }
}

export function isPathContained(
  filePath: string,
  projectDir: string,
): PathContainmentResult {
  const resolvedFile = normalizePath(safeRealpath(filePath));
  const resolvedDir = normalizePath(safeRealpath(projectDir));

  if (resolvedFile === resolvedDir) {
    return { contained: true, resolvedPath: resolvedFile };
  }

  const contained = resolvedFile.startsWith(resolvedDir + path.sep);
  return {
    contained,
    resolvedPath: resolvedFile,
    reason: contained
      ? undefined
      : `Path '${resolvedFile}' escapes project boundary '${resolvedDir}'`,
  };
}
