/* Uji otomatis mesin permainan MYSTERY BOX — dijalankan di Node. */
import { gameReducer, initialState, generateBoxes, rankGroups, checkAuto, currentQuestion } from "../src/lib/engine";
import { DEFAULT_QUESTIONS } from "../src/data/questions";
import { DEFAULT_SETTINGS } from "../src/lib/engine";
import type { GameState, Group, GameAction } from "../src/types";
import { GROUP_COLORS } from "../src/types";
import * as XLSX from "xlsx";
import { TEMPLATE_HEADERS, parseQuestionFile } from "../src/lib/excel";

let passed = 0, failed = 0;
function ok(cond: boolean, msg: string) {
  if (cond) { passed++; }
  else { failed++; console.error("❌ GAGAL:", msg); }
}

const groups: Group[] = [1, 2, 3, 4].map((i) => ({
  id: i, name: `Kelompok ${i}`, color: GROUP_COLORS[i - 1],
  points: 0, correct: 0, wrong: 0, bonusCount: 0, doubleCount: 0, challengeCount: 0,
}));

// ---- 1. Generate boxes ----
for (let t = 0; t < 50; t++) {
  const boxes = generateBoxes(DEFAULT_QUESTIONS);
  ok(boxes.length === 30, "30 kotak");
  ok(boxes.every((b) => b.value >= 10 && b.value <= 100 && b.value % 10 === 0), "nilai 10..100 kelipatan 10");
  ok(new Set(boxes.map((b) => b.qIndex)).size === 30, "urutan soal permutasi unik");
  const nB = boxes.filter((b) => b.surprise === "BONUS").length;
  const nD = boxes.filter((b) => b.surprise === "DOUBLE").length;
  const nC = boxes.filter((b) => b.surprise === "CHALLENGE").length;
  ok(nB >= 3 && nB <= 5 && nD >= 3 && nD <= 5 && nC >= 3 && nC <= 5, "kejutan 3–5 per jenis, eksklusif");
}

// ---- 2. Full playthrough ----
let s = gameReducer(initialState(), { type: "START_GAME", groups, questions: DEFAULT_QUESTIONS, settings: DEFAULT_SETTINGS });
ok(s.phase === "pick" && s.turn === 0, "mulai di fase pick, giliran kelompok 1");
const d = (a: GameAction) => { s = gameReducer(s, a); };

let round = 0;
let throwsSeen = 0, challengesSeen = 0, doublesSeen = 0, bonusesSeen = 0, gugurSeen = 0, skipsSeen = 0;
while (s.phase !== "finished" && round < 40) {
  const expectedTurnGroup = s.groups[s.turn].id;
  const idx = s.boxes.findIndex((b) => !b.opened);
  d({ type: "PICK_BOX", index: idx });
  ok(s.phase === "opening", `ronde ${round}: opening`);
  // spam pick saat opening harus diabaikan
  const opened = s.openedCount;
  d({ type: "PICK_BOX", index: s.boxes.findIndex((b) => !b.opened) });
  ok(s.openedCount === opened, "pick kedua saat opening diabaikan");
  d({ type: "OPEN_DONE" });
  ok(s.phase === "question" && s.answerer === expectedTurnGroup && s.timeLeft === 60, "soal untuk pemilih, timer 60");
  const box = s.boxes[s.currentBox!];
  const q = currentQuestion(s)!;
  const scenario = round % 6;

  if (scenario === 0 || scenario === 1) {
    // benar langsung (auto utk PG/BS, manual utk ISIAN/URAIAN)
    const before = s.groups.find((g) => g.id === s.answerer)!.points;
    const chosen = q.type === "PG" ? q.key : q.type === "BENAR_SALAH" ? q.key : "lisan";
    const correct = q.type === "PG" || q.type === "BENAR_SALAH" ? checkAuto(q, chosen) : true;
    d({ type: "RESOLVE", correct, chosen });
    d({ type: "RESOLVE", correct, chosen }); // spam harus diabaikan
    if (box.surprise === "CHALLENGE") {
      challengesSeen++;
      ok(s.phase === "challenge" && s.timeLeft === 30, "challenge 30 detik");
      const success = round % 2 === 0;
      if (success) { d({ type: "CHALLENGE_GRADE", success: true }); d({ type: "CHALLENGE_GRADE", success: true }); }
      else { d({ type: "TICK", dt: 31 }); } // timeout challenge = gagal
      const exp = box.value + (success ? 50 : 0);
      ok(s.groups.find((g) => g.id === expectedTurnGroup)!.points === before + exp, `challenge poin ${exp}`);
    } else {
      const exp = box.value * (box.surprise === "DOUBLE" ? 2 : 1) + (box.surprise === "BONUS" ? 50 : 0);
      if (box.surprise === "DOUBLE") doublesSeen++;
      if (box.surprise === "BONUS") bonusesSeen++;
      ok(s.groups.find((g) => g.id === expectedTurnGroup)!.points === before + exp, `poin benar ${exp} (nilai ${box.value}, ${box.surprise})`);
    }
    ok(s.phase === "result", "fase result");
  } else if (scenario === 2 || scenario === 3) {
    // salah → lemparan → benar
    d({ type: "RESOLVE", correct: false, chosen: "salah" });
    ok(s.phase === "throw", "fase lemparan");
    ok(s.answerer !== expectedTurnGroup && s.attempt === 2, "penerima acak ≠ pemilih, kesempatan 2");
    throwsSeen++;
    const receiver = s.answerer!;
    d({ type: "THROW_DONE" });
    ok(s.phase === "question" && s.timeLeft === 60, "timer penerima 60");
    const before = s.groups.find((g) => g.id === receiver)!.points;
    d({ type: "RESOLVE", correct: true, chosen: "benar penerima" });
    if (box.surprise === "CHALLENGE") {
      challengesSeen++;
      d({ type: "CHALLENGE_GRADE", success: true });
    }
    const exp = box.value * (box.surprise === "DOUBLE" ? 2 : 1) + (box.surprise === "BONUS" ? 50 : 0) + (box.surprise === "CHALLENGE" ? 50 : 0);
    ok(s.groups.find((g) => g.id === receiver)!.points === before + exp, "penerima lemparan nilai penuh + kejutan");
    if (box.surprise === "DOUBLE") doublesSeen++;
    if (box.surprise === "BONUS") bonusesSeen++;
  } else if (scenario === 4) {
    // waktu habis dua kali → gugur
    d({ type: "TICK", dt: 61 });
    ok(s.phase === "throw", "timeout pertama → lemparan");
    throwsSeen++;
    d({ type: "THROW_DONE" });
    d({ type: "TICK", dt: 61 });
    ok(s.phase === "result" && s.lastResult!.status === "GUGUR" && s.lastResult!.totalPts === 0, "timeout kedua → gugur tanpa poin");
    gugurSeen++;
  } else {
    d({ type: "SKIP" });
    ok(s.phase === "result" && s.lastResult!.status === "DILEWATI", "skip → dilewati");
    skipsSeen++;
  }

  const turnBefore = s.turn;
  d({ type: "NEXT" });
  if (s.phase !== "finished") ok(s.turn === (turnBefore + 1) % 4, "giliran berurutan setelah lemparan/skip");
  round++;
}
ok(s.phase === "finished", "30 kotak → finished");
ok(round === 30, "tepat 30 ronde");
ok(throwsSeen > 0 && gugurSeen > 0 && skipsSeen > 0, `skenario tercakup (lemparan ${throwsSeen}, gugur ${gugurSeen}, skip ${skipsSeen}, challenge ${challengesSeen}, double ${doublesSeen}, bonus ${bonusesSeen})`);
const totalHistory = s.history.reduce((a, h) => a + h.totalPts, 0);
const totalGroups = s.groups.reduce((a, g) => a + g.points, 0);
ok(totalHistory === totalGroups, `konservasi poin: riwayat ${totalHistory} = kelompok ${totalGroups}`);
ok(s.history.length === 30, "30 entri riwayat");
const wrongTotal = s.groups.reduce((a, g) => a + g.wrong, 0);
const expectedWrong = s.history.filter((h) => h.status === "GUGUR").length * 2 + s.history.filter((h) => h.firstWrong && h.status === "BENAR").length;
ok(wrongTotal === expectedWrong, `statistik salah konsisten (${wrongTotal} = ${expectedWrong})`);

// ---- 3. Koreksi poin tercatat ----
d({ type: "ADJUST_SCORE", groupId: 1, delta: 50 });
d({ type: "ADJUST_SCORE", groupId: 1, delta: -1000 });
ok(s.groups[0].points >= 0, "poin tidak negatif");
ok(s.adjustments.length === 2, "koreksi tercatat");

// ---- 4. Reset ----
d({ type: "RESET" });
ok(s.phase === "pick" && s.boxes.length === 0 && s.history.length === 0, "reset bersih");

// ---- 5. Cancel & timer ops ----
s = gameReducer(initialState(), { type: "START_GAME", groups, questions: DEFAULT_QUESTIONS, settings: DEFAULT_SETTINGS });
d({ type: "PICK_BOX", index: 0 });
d({ type: "OPEN_DONE" });
d({ type: "RESOLVE", correct: false, chosen: "x" });
d({ type: "CANCEL" });
ok(s.phase === "pick" && s.openedCount === 0 && !s.boxes[0].opened, "cancel mengembalikan kotak");
ok(s.groups.every((g) => g.wrong === 0), "cancel memulihkan statistik salah");
ok(s.turn === 0, "cancel tidak mengubah giliran");
d({ type: "PICK_BOX", index: 0 });
d({ type: "OPEN_DONE" });
d({ type: "TIMER_ADD", seconds: 10 });
ok(s.timeLeft === 70, "tambah waktu");
d({ type: "TIMER_SET", seconds: 45 });
ok(s.timeLeft === 45 && s.timerTotal === 45, "atur durasi");
d({ type: "TIMER_PAUSE" });
const t0 = s.timeLeft;
d({ type: "TICK", dt: 5 });
ok(s.timeLeft === t0, "pause menghentikan tick");
d({ type: "TIMER_RESUME" });
d({ type: "TIMER_RESET" });
ok(s.timeLeft === 45, "reset timer");
d({ type: "GAME_PAUSE" });
d({ type: "TICK", dt: 5 });
ok(s.timeLeft === 45, "jeda game menghentikan tick");
d({ type: "GAME_RESUME" });
d({ type: "TIMER_STOP" });
ok(s.phase === "throw", "stop timer = waktu habis → lemparan");

// ---- 6. Ranking seri ----
const tied = rankGroups([
  { ...groups[0], points: 100 }, { ...groups[1], points: 200 },
  { ...groups[2], points: 200 }, { ...groups[3], points: 50 },
]);
ok(tied[0].rank === 1 && tied[1].rank === 1 && tied[2].rank === 3 && tied[3].rank === 4, "peringkat seri 1,1,3,4");

// ---- 7. Excel: template → parse valid; file rusak → error ----
async function excelTests() {
  const wb = XLSX.utils.book_new();
  const rows = DEFAULT_QUESTIONS.map((q) => [q.no, q.type, q.text, q.options[0] ?? "", q.options[1] ?? "", q.options[2] ?? "", q.options[3] ?? "", q.key, q.explanation]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...rows]), "BANK SOAL");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const good = await parseQuestionFile(new File([buf], "valid.xlsx"));
  ok(good.questions.length === 30 && good.errors.length === 0, `excel valid 30 soal (errors: ${good.errors.join("; ")})`);

  const badRows = rows.map((r) => [...r]);
  badRows[0][7] = "E"; // kunci PG invalid
  badRows[1][2] = ""; // pertanyaan kosong
  badRows[14][7] = "MUNGKIN"; // BS invalid
  badRows.pop(); // 29 soal
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...badRows]), "BANK SOAL");
  const buf2 = XLSX.write(wb2, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const bad = await parseQuestionFile(new File([buf2], "rusak.xlsx"));
  ok(bad.questions.length === 0, "file rusak ditolak");
  ok(bad.errors.some((e) => e.includes("Soal 1") && e.includes("A / B / C / D")), "error kunci PG menyebut nomor soal");
  ok(bad.errors.some((e) => e.includes("Soal 2") && e.includes("kosong")), "error pertanyaan kosong");
  ok(bad.errors.some((e) => e.includes("Soal 15")), "error kunci BENAR_SALAH");
  ok(bad.errors.some((e) => e.includes("29")), "error jumlah soal");

  console.log(`\n=== HASIL: ${passed} lulus, ${failed} gagal ===`);
  if (failed > 0) process.exit(1);
}
void excelTests();
