// Last-write-wins merge: for anything with a task still sitting in the local
// sync queue, local wins (it hasn't reached the server yet, so the pulled
// remote snapshot is stale for that row). Everything else, remote wins.
export function mergeEntities<T extends { id: string }>(local: T[], remote: T[], pendingIds: Set<string>): T[] {
  const remoteById = new Map(remote.map((r) => [r.id, r]));
  const result: T[] = [];
  const handled = new Set<string>();

  for (const l of local) {
    handled.add(l.id);
    if (pendingIds.has(l.id)) {
      result.push(l);
      continue;
    }
    const r = remoteById.get(l.id);
    if (r) result.push(r);
    // else: not pending and missing remotely => another device deleted it; drop it here too.
  }

  for (const r of remote) {
    if (handled.has(r.id) || pendingIds.has(r.id)) continue;
    result.push(r);
  }

  return result;
}

export function mergeKeyed<T>(
  local: Record<string, T>,
  remote: Record<string, T>,
  pendingKeys: Set<string>
): Record<string, T> {
  const result: Record<string, T> = {};
  const handled = new Set<string>();

  for (const [key, value] of Object.entries(local)) {
    handled.add(key);
    if (pendingKeys.has(key)) {
      result[key] = value;
      continue;
    }
    if (remote[key]) result[key] = remote[key];
    else result[key] = value; // no remote counterpart yet (e.g. not synced) — keep local
  }

  for (const [key, value] of Object.entries(remote)) {
    if (handled.has(key) || pendingKeys.has(key)) continue;
    result[key] = value;
  }

  return result;
}
