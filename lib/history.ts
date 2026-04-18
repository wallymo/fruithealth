import { openDB, type IDBPDatabase } from "idb";
import type { Scan } from "./types";

const DB_NAME = "fruithealth";
const STORE = "scans";
const MAX_SCANS = 100;

interface ScansDB {
  [STORE]: Scan;
}

let dbPromise: Promise<IDBPDatabase<ScansDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScansDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function saveScan(scan: Scan): Promise<void> {
  const db = await getDB();
  await db.put(STORE, scan);
  const all = await db.getAll(STORE);
  if (all.length > MAX_SCANS) {
    const sorted = all.sort((a, b) => a.createdAt - b.createdAt);
    const extras = sorted.slice(0, all.length - MAX_SCANS);
    const tx = db.transaction(STORE, "readwrite");
    await Promise.all(extras.map((s) => tx.store.delete(s.id)));
    await tx.done;
  }
}

export async function listScans(): Promise<Scan[]> {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getLastScan(): Promise<Scan | undefined> {
  const all = await listScans();
  return all[0];
}
