import { JSONBIN_API_KEY, JSONBIN_BIN_ID } from '../config/storage';
import type { CaptureRecord } from '../types';

const useCloud = !!(JSONBIN_API_KEY && JSONBIN_BIN_ID);
const BIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_API_KEY,
};

function log(msg: string, ...args: unknown[]) {
  console.log(`[Nover Cloud] ${msg}`, ...args);
}

/**
 * Extract an array of CaptureRecords from whatever JSONBin returns.
 * JSONBin v3 wraps responses:  { record: <your data>, metadata: {...} }
 */
function extractRecords(raw: unknown): CaptureRecord[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const inner = obj.record;
    if (Array.isArray(inner)) return inner;
    // If the record is a non-array object, it was never initialized — return empty
    if (inner && typeof inner === 'object') return [];
    if (!inner) return [];
  }
  return [];
}

/**
 * Save a new capture to JSONBin (or localStorage fallback).
 */
export async function saveCapture(record: CaptureRecord): Promise<void> {
  if (useCloud) {
    try {
      // 1. Read the latest data
      log('Reading bin...');
      const getRes = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });

      if (!getRes.ok) {
        log('GET failed:', getRes.status, getRes.statusText);
        throw new Error(`GET bin returned ${getRes.status}`);
      }

      const getData = await getRes.json();
      const existing = extractRecords(getData);
      log(`Bin has ${existing.length} existing records`);

      // 2. Prepend the new record
      existing.unshift(record);

      // 3. Write back
      log('Writing back...');
      const putRes = await fetch(BIN_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(existing),
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        log('PUT failed:', putRes.status, errText);
        throw new Error(`PUT bin returned ${putRes.status}: ${errText}`);
      }

      log(`✅ Saved! ${existing.length} records now in bin.`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('❌ Cloud save failed:', msg);
      console.warn('[Nover] Cloud save failed, falling back to localStorage');
    }
  }

  // localStorage fallback
  try {
    const existing = JSON.parse(localStorage.getItem('nover-captures') || '[]');
    existing.unshift(record);
    localStorage.setItem('nover-captures', JSON.stringify(existing));
    log('Saved to localStorage fallback');
  } catch (e) {
    console.error('localStorage save also failed:', e);
  }
}

/**
 * Fetch all captures from JSONBin (or localStorage fallback).
 */
export async function fetchCaptures(): Promise<CaptureRecord[]> {
  if (useCloud) {
    try {
      log('Fetching captures...');
      const res = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });

      if (!res.ok) {
        log('GET failed:', res.status, res.statusText);
        throw new Error(`GET bin returned ${res.status}`);
      }

      const data = await res.json();
      const records = extractRecords(data);
      log(`Fetched ${records.length} records from cloud`);
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return records;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log('❌ Cloud fetch failed:', msg);
      console.warn('[Nover] Cloud fetch failed, falling back to localStorage');
    }
  }

  // localStorage fallback
  try {
    const stored = localStorage.getItem('nover-captures');
    if (stored) {
      const records: CaptureRecord[] = JSON.parse(stored);
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      log(`Fetched ${records.length} records from localStorage`);
      return records;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export async function clearCaptures(): Promise<void> {
  if (useCloud) {
    try {
      await fetch(BIN_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify([]),
      });
      log('Cleared all records from cloud');
      return;
    } catch (err) {
      console.warn('Cloud clear failed:', err);
    }
  }
  localStorage.setItem('nover-captures', '[]');
}

export async function deleteCapture(id: string): Promise<void> {
  if (useCloud) {
    try {
      const getRes = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });
      const getData = await getRes.json();
      const existing = extractRecords(getData);
      const filtered = existing.filter(r => r.id !== id);
      await fetch(BIN_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(filtered),
      });
      return;
    } catch (err) {
      console.warn('Cloud delete failed:', err);
    }
  }
  const existing = JSON.parse(localStorage.getItem('nover-captures') || '[]');
  const filtered = existing.filter((r: CaptureRecord) => r.id !== id);
  localStorage.setItem('nover-captures', JSON.stringify(filtered));
}

export { useCloud };
export type { CaptureRecord };
