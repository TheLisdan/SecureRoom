const rootLocationKey = "root";

export function normalizeSiblingName(name: string): string {
  return name.trim().toLowerCase();
}

export function locationKey(id: string | null | undefined): string {
  return id ?? rootLocationKey;
}
