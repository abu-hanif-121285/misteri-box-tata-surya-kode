/* Uji ekspor PDF & Excel dengan data permainan nyata dari engine. */
import { gameReducer, initialState, DEFAULT_SETTINGS } from "../src/lib/engine";
import { DEFAULT_QUESTIONS } from "../src/data/questions";
import { GROUP_COLORS, type GameState, type Group, type GameAction } from "../src/types";
import { buildResultsPdf } from "../src/lib/pdf";
import { exportResultsExcel, downloadTemplate } from "../src/lib/excel";
import * as XLSX from "xlsx";
import * as fs from "fs";

let passed = 0, failed = 0;
const ok = (c: boolean, m: string) => { if (c) passed++; else { failed++; console.error("❌", m); } };

const groups: Group[] = [1, 2, 3].map((i) => ({
  id: i, name: `Tim ${i}`, color: GROUP_COLORS[i - 1],
  points: 0, correct: 0, wrong: 0, bonusCount: 0, doubleCount: 0, challengeCount: 0,
}));

let s = gameReducer(initialState(), { type: "START_GAME", groups, questions: DEFAULT_QUESTIONS, settings: DEFAULT_SETTINGS });
const d = (a: GameAction) => { s = gameReducer(s, a); };
let round = 0;
while (s.phase !== "finished" && round < 40) {
  d({ type: "PICK_BOX", index: s.boxes.findIndex((b) => !b.opened) });
  d({ type: "OPEN_DONE" });
  if (round % 3 === 0) d({ type: "RESOLVE", correct: false, chosen: "salah" });
  if (s.phase === "throw") { d({ type: "THROW_DONE" }); d({ type: round % 2 ? "RESOLVE" : "TICK", ...(round % 2 ? { correct: true, chosen: "benar" } : { dt: 99 }) } as GameAction); }
  if (s.phase === "challenge") d({ type: "CHALLENGE_GRADE", success: round % 2 === 0 });
  if (s.phase === "question") d({ type: "RESOLVE", correct: true, chosen: "benar" });
  if (s.phase === "challenge") d({ type: "CHALLENGE_GRADE", success: true });
  d({ type: "NEXT" });
  round++;
}
d({ type: "ADJUST_SCORE", groupId: 2, delta: 25 });
ok(s.phase === "finished" && s.history.length === 30, "permainan selesai utk ekspor");

// PDF
const pdf = buildResultsPdf(s);
const bytes = pdf.output("arraybuffer") as ArrayBuffer;
ok(bytes.byteLength > 5000, `PDF terbentuk (${bytes.byteLength} bytes)`);
ok(pdf.getNumberOfPages() >= 2, `PDF multi-halaman (${pdf.getNumberOfPages()})`);
fs.writeFileSync("/tmp/mb-hasil.pdf", Buffer.from(bytes));

// Excel (writeFile → disk di Node)
process.chdir("/tmp");
exportResultsExcel(s);
const files = fs.readdirSync("/tmp").filter((f) => f.startsWith("MYSTERY-BOX-Hasil-") && f.endsWith(".xlsx"));
ok(files.length > 0, "file Excel terbentuk");
const wb = XLSX.readFile("/tmp/" + files[0]);
ok(wb.SheetNames.join(",") === "REKAP SKOR,RIWAYAT PERMAINAN,RINCIAN NILAI", `3 sheet benar: ${wb.SheetNames}`);
const rekap = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["REKAP SKOR"]);
ok(rekap.length === 3, "rekap 3 kelompok");
const totalRekap = rekap.reduce((a, r) => a + Number(r["Total Poin"]), 0);
const totalEngine = s.groups.reduce((a, g) => a + g.points, 0);
ok(totalRekap === totalEngine, `poin rekap = engine (${totalRekap})`);
const riwayat = XLSX.utils.sheet_to_json(wb.Sheets["RIWAYAT PERMAINAN"]);
ok(riwayat.length === 30, "riwayat 30 baris");
const rincianText = XLSX.utils.sheet_to_csv(wb.Sheets["RINCIAN NILAI"]);
ok(rincianText.includes("KOREKSI POIN OLEH GURU"), "koreksi poin tercatat di rincian");

// Template
process.chdir("/tmp");
downloadTemplate();
ok(fs.existsSync("/tmp/MYSTERY-BOX-Template-Soal.xlsx"), "template terunduh");
const twb = XLSX.readFile("/tmp/MYSTERY-BOX-Template-Soal.xlsx");
ok(twb.SheetNames.includes("BANK SOAL") && twb.SheetNames.includes("PETUNJUK"), "template punya BANK SOAL + PETUNJUK");
const trows = XLSX.utils.sheet_to_json(twb.Sheets["BANK SOAL"]);
ok(trows.length === 30, "template berisi 30 contoh soal");

console.log(`\n=== EKSPOR: ${passed} lulus, ${failed} gagal ===`);
if (failed > 0) process.exit(1);
