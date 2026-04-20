export function nowIso(): string {
  return new Date().toISOString();
}

export function secondsSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 1000;
}

export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
