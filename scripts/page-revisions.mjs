import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { promisify } from 'node:util';
const run = promisify(execFile);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function createRevision(content, previous, actualDate) {
  const contentHash = createHash('sha256').update(content).digest('hex');
  if (previous?.contentHash === contentHash && validDate(previous.lastmod)) return previous;
  if (!validDate(actualDate)) throw new Error('A changed page requires a verifiable modification date');
  return { contentHash, lastmod: actualDate };
}
export async function sourceModificationDate(paths) {
  let date;
  try {
    const result = await run('git', ['log', '-1', '--format=%cI', '--', ...paths]);
    const timestamp = Date.parse(result.stdout.trim());
    // A committer's local calendar day may be tomorrow in UTC near midnight.
    if (Number.isFinite(timestamp)) date = new Date(timestamp).toISOString().slice(0, 10);
    const status = await run('git', ['status', '--porcelain', '--untracked-files=all', '--', ...paths]);
    for (const line of status.stdout.split('\n').filter(Boolean)) {
      const name = line.slice(3);
      try {
        const changed = (await stat(name)).mtime.toISOString().slice(0, 10);
        if (validDate(changed) && (!date || changed > date)) date = changed;
      } catch { /* A removed source is represented by its commit history. */ }
    }
  } catch { /* Exported builds use the committed revision manifest / editorial dates. */ }
  return date;
}
