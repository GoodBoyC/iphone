import { JSONBIN_API_KEY, JSONBIN_BIN_ID } from '../config/storage';
import type { CaptureRecord } from '../types';

const useCloud = !!(JSONBIN_API_KEY && JSONBIN_BIN_ID);
const BIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_API_KEY,
};

/**
 * Append a new capture to the cloud bin.
 * Falls back to localStorage if cloud not configured.
 */
export async function saveCapture(record: CaptureRecord): Promise<void> {
  if (useCloud) {
    try {
      // Read current data from the bin
      const getRes = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });
      const getData = await getRes.json();
      const existing: CaptureRecord[] = getData.record || [];

      // Prepend new record
      existing.unshift(record);

      // Write back
      await fetch(BIN_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(existing),
      });
      return;
    } catch (err) {
      console.warn('Cloud save failed, falling back to localStorage:', err);
    }
  }

  // localStorage fallback
  const existing = JSON.parse(localStorage.getItem('nover-captures') || '[]');
  existing.unshift(record);
  localStorage.setItem('nover-captures', JSON.stringify(existing));
}

/**
 * Fetch all captures from the cloud.
 * Falls back to localStorage if cloud not configured.
 */
export async function fetchCaptures(): Promise<CaptureRecord[]> {
  if (useCloud) {
    try {
      const res = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });
      const data = await res.json();
      const records: CaptureRecord[] = data.record || [];
      // Sort newest first
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return records;
    } catch (err) {
      console.warn('Cloud fetch failed, falling back to localStorage:', err);
    }
  }

  // localStorage fallback
  try {
    const stored = localStorage.getItem('nover-captures');
    if (stored) {
      const records: CaptureRecord[] = JSON.parse(stored);
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return records;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Delete all captures from the cloud bin.
 */
export async function clearCaptures(): Promise<void> {
  if (useCloud) {
    try {
      await fetch(BIN_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify([]),
      });
      return;
    } catch (err) {
      console.warn('Cloud clear failed:', err);
    }
  }
  localStorage.setItem('nover-captures', '[]');
}

/**
 * Delete a single capture by id from the cloud bin.
 */
export async function deleteCapture(id: string): Promise<void> {
  if (useCloud) {
    try {
      const getRes = await fetch(`${BIN_URL}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY },
      });
      const getData = await getRes.json();
      const existing: CaptureRecord[] = getData.record || [];
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
  // localStorage fallback
  const existing = JSON.parse(localStorage.getItem('nover-captures') || '[]');
  const filtered = existing.filter((r: CaptureRecord) => r.id !== id);
  localStorage.setItem('nover-captures', JSON.stringify(filtered));
}

export { useCloud };
export type { CaptureRecord };
