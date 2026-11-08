/**
 * Mode dua perangkat (OPSIONAL) — Firebase Realtime Database.
 * Tidak ada kredensial bawaan: guru harus menempel konfigurasi proyeknya sendiri.
 * Tanpa konfigurasi, mode satu perangkat tetap berfungsi penuh.
 */
import type { GameState, GameAction, Question } from "../types";
import { currentQuestion } from "./engine";

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  [k: string]: unknown;
}

const LS_KEY = "mb_firebase_config";

export function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as FirebaseConfig;
    return cfg && typeof cfg.databaseURL === "string" && cfg.databaseURL.startsWith("https://") ? cfg : null;
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(text: string): { ok: boolean; message: string } {
  try {
    const cleaned = text.trim().replace(/^const\s+firebaseConfig\s*=\s*/, "").replace(/;\s*$/, "");
    const cfg = JSON.parse(cleaned) as FirebaseConfig;
    if (!cfg.apiKey || !cfg.projectId) return { ok: false, message: "Konfigurasi harus memuat apiKey dan projectId." };
    if (!cfg.databaseURL || !cfg.databaseURL.startsWith("https://")) {
      return { ok: false, message: 'databaseURL wajib diisi (contoh: https://nama-proyek-default-rtdb.firebaseio.com). Buat Realtime Database di konsol Firebase terlebih dahulu.' };
    }
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    return { ok: true, message: "Konfigurasi tersimpan di perangkat ini. Mode dua perangkat siap digunakan." };
  } catch {
    return { ok: false, message: "Format tidak valid. Tempel objek konfigurasi Firebase dalam format JSON (kunci diapit tanda kutip ganda)." };
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem(LS_KEY);
  void disconnectFirebase();
}

export function isFirebaseConfigured(): boolean {
  return loadFirebaseConfig() !== null;
}

export interface MirrorState extends GameState {
  currentQuestion: Question | null;
}

/** Paket state untuk remote: soal lain tidak ikut dikirim, hanya soal aktif. */
export function packState(s: GameState): MirrorState {
  return { ...s, questions: [], currentQuestion: currentQuestion(s) };
}

type Db = import("firebase/database").Database;
let appInstance: import("firebase/app").FirebaseApp | null = null;
let dbInstance: Db | null = null;
let unsubs: (() => void)[] = [];

async function getDb(): Promise<Db> {
  const cfg = loadFirebaseConfig();
  if (!cfg) throw new Error("Firebase belum dikonfigurasi. Mode dua perangkat belum tersedia.");
  if (dbInstance) return dbInstance;
  const { initializeApp, getApps, deleteApp } = await import("firebase/app");
  const { getDatabase } = await import("firebase/database");
  for (const a of getApps()) if (a.name === "mystery-box") await deleteApp(a);
  appInstance = initializeApp(cfg as import("firebase/app").FirebaseOptions, "mystery-box");
  dbInstance = getDatabase(appInstance);
  return dbInstance;
}

export async function disconnectFirebase() {
  for (const u of unsubs) { try { u(); } catch { /* noop */ } }
  unsubs = [];
  dbInstance = null;
  if (appInstance) {
    const { deleteApp } = await import("firebase/app");
    try { await deleteApp(appInstance); } catch { /* noop */ }
    appInstance = null;
  }
}

export function makeSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** HOST (laptop/proyektor): publikasikan state & terima perintah remote. */
export async function hostStartSession(
  code: string,
  state: GameState,
  onCommand: (a: GameAction & { at?: number }) => void,
  onStatus: (connected: boolean) => void,
): Promise<void> {
  const db = await getDb();
  const { ref, set, onChildAdded, remove, onValue } = await import("firebase/database");
  const base = `sessions/${code}`;
  await set(ref(db, `${base}/state`), JSON.parse(JSON.stringify(packState(state))));
  await set(ref(db, `${base}/createdAt`), Date.now());
  const cmdRef = ref(db, `${base}/commands`);
  const un1 = onChildAdded(cmdRef, (snap) => {
    const val = snap.val();
    void remove(snap.ref);
    if (val && typeof val.type === "string" && Date.now() - (val.at ?? 0) < 15000) onCommand(val);
  });
  const un2 = onValue(ref(db, ".info/connected"), (snap) => onStatus(Boolean(snap.val())));
  unsubs.push(un1, un2);
}

export async function hostPublish(code: string, state: GameState): Promise<void> {
  if (!dbInstance) return;
  const { ref, set } = await import("firebase/database");
  await set(ref(dbInstance, `sessions/${code}/state`), JSON.parse(JSON.stringify(packState(state))));
}

export async function hostEndSession(code: string): Promise<void> {
  if (!dbInstance) return;
  const { ref, remove } = await import("firebase/database");
  try { await remove(ref(dbInstance, `sessions/${code}`)); } catch { /* noop */ }
}

/** REMOTE (ponsel guru): baca state & kirim perintah. */
export async function remoteJoin(
  code: string,
  onState: (s: MirrorState | null) => void,
  onStatus: (connected: boolean) => void,
): Promise<void> {
  const db = await getDb();
  const { ref, get, onValue } = await import("firebase/database");
  const snap = await get(ref(db, `sessions/${code}/createdAt`));
  if (!snap.exists()) throw new Error(`Sesi "${code}" tidak ditemukan. Pastikan laptop host sudah membuat sesi.`);
  const un1 = onValue(ref(db, `sessions/${code}/state`), (s) => onState(s.val() as MirrorState | null));
  const un2 = onValue(ref(db, ".info/connected"), (s) => onStatus(Boolean(s.val())));
  unsubs.push(un1, un2);
}

export async function remoteSend(code: string, action: GameAction): Promise<void> {
  const db = await getDb();
  const { ref, push } = await import("firebase/database");
  await push(ref(db, `sessions/${code}/commands`), JSON.parse(JSON.stringify({ ...action, at: Date.now() })));
}