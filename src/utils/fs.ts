import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export function ensureDirFor(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function writeJsonFile(filePath: string, value: unknown): void {
  ensureDirFor(filePath);
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function appendNdjson(filePath: string, value: unknown): void {
  ensureDirFor(filePath);
  appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}
