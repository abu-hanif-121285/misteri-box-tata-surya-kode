/* Uji render seluruh komponen kunci pada berbagai fase (react-dom/server). */
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: () => null, setItem: () => undefined, removeItem: () => undefined,
  clear: () => undefined, key: () => null, length: 0,
} as Storage;

import { renderToString } from "react-dom/server";
import App from "../src/App";
import Setup from "../src/components/Setup";
import GameBoard from "../src/components/GameBoard";
import QuestionStage from "../src/components/QuestionStage";
import TeacherPanel from "../src/components/TeacherPanel";
import Results from "../src/components/Results";
import HelpModal from "../src/components/HelpModal";
import Remote from "../src/components/Remote";
import { gameReducer, initialState, DEFAULT_SETTINGS } from "../src/lib/engine";
import { DEFAULT_QUESTIONS, DEFAULT_BANK_NAME } from "../src/data/questions";
import { GROUP_COLORS, type GameState, type Group, type GameAction, type QType } from "../src/types";

let passed = 0, failed = 0;
function ok(name: string, rawHtml: string, must: string[]) {
  const html = rawHtml.replace(/<!-- -->/g, "");
  const missing = must.filter((m) => !html.includes(m));
  if (missing.length === 0) { passed++; console.log("✅", name); }
  else { failed++; console.error("❌", name, "— tidak ditemukan:", missing); }
}
function render(name: string, el: React.ReactElement, must: string[]) {
  try { ok(name, renderToString(el), must); }
  catch (e) { failed++; console.error("❌ CRASH", name, e); }
}

const groups: Group[] = [1, 2, 3, 4].map((i) => ({
  id: i, name: `Tim ${i}`, color: GROUP_COLORS[i - 1],
  points: 0, correct: 0, wrong: 0, bonusCount: 0, doubleCount: 0, challengeCount: 0,
}));
const base = () => gameReducer(initialState(), { type: "START_GAME", groups, questions: DEFAULT_QUESTIONS, settings: { ...DEFAULT_SETTINGS, revealExplanation: "always" } });
const noop = (_a: GameAction) => undefined;

function stateForType(type: QType, surprise?: "BONUS" | "DOUBLE" | "CHALLENGE"): GameState {
  let s = base();
  const idx = s.boxes.findIndex((b) => s.questions[b.qIndex].type === type && (surprise ? b.surprise === surprise : true));
  const use = idx >= 0 ? idx : s.boxes.findIndex((b) => s.questions[b.qIndex].type === type);
  s = gameReducer(s, { type: "PICK_BOX", index: use });
  s = gameReducer(s, { type: "OPEN_DONE" });
  if (surprise && s.boxes[s.currentBox!].surprise !== surprise) {
    s = { ...s, boxes: s.boxes.map((b, i) => (i === s.currentBox ? { ...b, surprise } : b)) };
  }
  return s;
}

render("App (landing)", <App />, ["MYSTERY", "MULAI PERMAINAN", "MODE GURU", "PETUNJUK", "wiyanto abu hanif"]);
render("Setup", <Setup bank={{ questions: DEFAULT_QUESTIONS, name: DEFAULT_BANK_NAME }} onBankChange={() => undefined} onStart={() => undefined} onBack={() => undefined} initialPassword="Inovatif" />, ["KELOMPOK", "DOWNLOAD TEMPLATE", "UPLOAD FILE EXCEL", "PREVIEW SOAL", "PERBAIKI FILE", "30 SOAL VALID"]);

const pick = base();
render("GameBoard (pick)", <GameBoard s={pick} view="guru" unlocked muted={false} sessionCode={null} online={false} onPick={noop as never} onMute={() => undefined} onToggleView={() => undefined} onLock={() => undefined} onLockTeacher={() => undefined} onHelp={() => undefined} onTeacher={() => undefined} />, ["PAPAN SKOR", "GILIRAN", "PILIH SATU KOTAK", "POIN", "KOTAK 0/30"]);
render("GameBoard (terkunci — tanpa kontrol guru)", <GameBoard s={pick} view="proyektor" unlocked={false} muted={false} sessionCode={null} online={false} onPick={noop as never} onMute={() => undefined} onToggleView={() => undefined} onLock={() => undefined} onLockTeacher={() => undefined} onHelp={() => undefined} onTeacher={() => undefined} />, ["Masuk Mode Guru (password)"]);

const pg = stateForType("PG");
render("Stage PG", <QuestionStage s={pg} dispatch={noop} view="guru" />, ["KESEMPATAN 1/2", "DETIK", "PILIHAN GANDA"]);
const bs = stateForType("BENAR_SALAH");
render("Stage BS", <QuestionStage s={bs} dispatch={noop} view="proyektor" />, ["BENAR", "SALAH"]);
const isian = stateForType("ISIAN");
render("Stage ISIAN guru", <QuestionStage s={isian} dispatch={noop} view="guru" />, ["Jawab secara lisan", "BENAR"]);
render("Stage ISIAN proyektor (tanpa tombol nilai)", <QuestionStage s={isian} dispatch={noop} view="proyektor" />, ["Guru sedang menilai"]);
const uraian = stateForType("URAIAN");
render("Stage URAIAN", <QuestionStage s={uraian} dispatch={noop} view="guru" />, ["URAIAN"]);

const thrown = gameReducer(pg, { type: "RESOLVE", correct: false, chosen: "A" });
render("Stage lemparan", <QuestionStage s={thrown} dispatch={noop} view="guru" />, ["LEMPARAN SOAL"]);

const ch = gameReducer(stateForType("PG", "CHALLENGE"), { type: "RESOLVE", correct: true, chosen: "kunci" });
render("Stage challenge", <QuestionStage s={ch} dispatch={noop} view="guru" />, ["SPECIAL CHALLENGE", "BERHASIL (+50)", "GAGAL (+0)"]);

const dbl = gameReducer(stateForType("PG", "DOUBLE"), { type: "RESOLVE", correct: true, chosen: "kunci" });
render("Hasil DOUBLE", <QuestionStage s={dbl} dispatch={noop} view="proyektor" />, ["JAWABAN BENAR", "DOUBLE POINT", "KUNCI JAWABAN"]);
const bon = gameReducer(stateForType("PG", "BONUS"), { type: "RESOLVE", correct: true, chosen: "kunci" });
render("Hasil BONUS", <QuestionStage s={bon} dispatch={noop} view="proyektor" />, ["BONUS POINT", "+50"]);
let gugur = gameReducer(pg, { type: "RESOLVE", correct: false, chosen: "A" });
gugur = gameReducer(gugur, { type: "THROW_DONE" });
gugur = gameReducer(gugur, { type: "RESOLVE", correct: false, chosen: "B" });
render("Hasil GUGUR", <QuestionStage s={gugur} dispatch={noop} view="proyektor" />, ["SOAL GUGUR", "KUNCI JAWABAN"]);

const panelAudio = { muted: false, musicOn: true, musicVol: 0.5, sfxVol: 0.8, setMuted: () => undefined, setMusicOn: () => undefined, setMusicVol: () => undefined, setSfxVol: () => undefined };
render("TeacherPanel", <TeacherPanel s={pg} dispatch={noop} view="guru" setView={() => undefined} audioCtl={panelAudio} password="Inovatif" onChangePassword={() => undefined} host={{ active: false, code: null, online: false }} onHostStart={() => undefined} onHostStop={() => undefined} onEndGame={() => undefined} onNewGame={() => undefined} onLock={() => undefined} onClose={() => undefined} />, ["PANEL GURU", "Kontrol", "AKHIRI PERMAINAN"]);

// Hasil dengan seri unik 1,1,3,4 (menguji perbaikan podium)
const fin: GameState = { ...gugur, phase: "finished", endedAt: Date.now(), groups: gugur.groups.map((g, i) => ({ ...g, points: [200, 200, 100, 50][i] })) };
render("Results seri 1,1,3,4", <Results s={fin} onNewGame={() => undefined} />, ["JUARA 1", "JUARA 3", "JUARA 4", "JUARA BERSAMA", "DOWNLOAD PDF", "DOWNLOAD EXCEL", "PERMAINAN BARU"]);

render("HelpModal", <HelpModal open onClose={() => undefined} />, ["PETUNJUK MYSTERY BOX", "Cara Bermain"]);
render("Remote (belum konfigurasi)", <Remote open onClose={() => undefined} />, ["BELUM TERSEDIA", "Firebase belum dikonfigurasi"]);

console.log(`\n=== RENDER: ${passed} lulus, ${failed} gagal ===`);
if (failed > 0) process.exit(1);
