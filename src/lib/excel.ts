import * as XLSX from "xlsx";
import type { GameState, QType, Question } from "../types";
import { DEFAULT_QUESTIONS } from "../data/questions";
import { rankGroups } from "./engine";

export const TEMPLATE_HEADERS = [
  "Nomor", "Jenis Soal", "Pertanyaan", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci Jawaban", "Pembahasan",
];

const SURPRISE_LABEL: Record<string, string> = {
  BONUS: "Bonus Point", DOUBLE: "Double Point", CHALLENGE: "Special Challenge", "": "-",
};

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const rows = DEFAULT_QUESTIONS.map((q) => [
    q.no, q.type, q.text, q.options[0] ?? "", q.options[1] ?? "", q.options[2] ?? "", q.options[3] ?? "", q.key, q.explanation,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...rows]);
  ws["!cols"] = [{ wch: 7 }, { wch: 14 }, { wch: 60 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 30 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, ws, "BANK SOAL");

  const guide = [
    ["PETUNJUK PENGISIAN TEMPLATE MYSTERY BOX"],
    [""],
    ["1. Isi tepat 30 soal pada sheet BANK SOAL (Nomor 1 sampai 30, tidak boleh kembar)."],
    ["2. Kolom Jenis Soal diisi salah satu dari: PG, BENAR_SALAH, ISIAN, URAIAN."],
    ["3. PG: wajib mengisi Opsi A, B, C, D. Kunci Jawaban diisi huruf A / B / C / D."],
    ["4. BENAR_SALAH: Kunci Jawaban diisi BENAR atau SALAH. Opsi boleh kosong."],
    ["5. ISIAN dan URAIAN: siswa menjawab lisan, guru menilai dengan tombol BENAR / SALAH."],
    ["   Kunci Jawaban ISIAN / URAIAN diisi panduan jawaban untuk guru (wajib)."],
    ["6. Kolom Pembahasan bersifat opsional (boleh kosong)."],
    ["7. JANGAN mengisi nilai poin. Nilai kotak (10–100) dibuat otomatis dan acak oleh aplikasi."],
    ["8. Jangan mengubah nama kolom / header dan nama sheet BANK SOAL."],
    ["9. Simpan file dalam format .xlsx lalu unggah melalui tombol UPLOAD FILE EXCEL."],
    [""],
    ["MYSTERY BOX — Buka Kotaknya, Pecahkan Misterinya! | created by wiyanto abu hanif"],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(guide);
  ws2["!cols"] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, ws2, "PETUNJUK");
  XLSX.writeFile(wb, "MYSTERY-BOX-Template-Soal.xlsx");
}

export interface ParseResult {
  questions: Question[];
  errors: string[];
  fileName: string;
}

function normType(raw: string): QType | null {
  const t = raw.trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (t === "PG" || t === "PILIHAN_GANDA") return "PG";
  if (t === "BENAR_SALAH" || t === "BS") return "BENAR_SALAH";
  if (t === "ISIAN" || t === "ISIAN_SINGKAT") return "ISIAN";
  if (t === "URAIAN" || t === "ESAI") return "URAIAN";
  return null;
}

export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const questions: Question[] = [];
  const buf = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "array" });
  } catch {
    return { questions: [], errors: ["File tidak dapat dibaca. Pastikan berformat Excel (.xlsx / .xls)."], fileName: file.name };
  }
  const sheetName = wb.SheetNames.find((n) => n.trim().toUpperCase() === "BANK SOAL") ?? wb.SheetNames[0];
  if (!sheetName) return { questions: [], errors: ["Workbook tidak memiliki sheet apa pun."], fileName: file.name };
  if (sheetName.trim().toUpperCase() !== "BANK SOAL") {
    errors.push(`Sheet "BANK SOAL" tidak ditemukan — menggunakan sheet pertama ("${sheetName}").`);
  }
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: "" });
  if (raw.length === 0) return { questions: [], errors: [...errors, "Sheet kosong — tidak ada baris soal."], fileName: file.name };

  // Normalisasi nama kolom (abaikan huruf besar/kecil & spasi)
  const canon: Record<string, string> = {};
  for (const h of TEMPLATE_HEADERS) canon[h.toLowerCase().replace(/\s+/g, "")] = h;
  const rows = raw.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      const c = canon[String(k).toLowerCase().replace(/\s+/g, "")];
      if (c) out[c] = String(v ?? "").trim();
    }
    return out;
  });
  const missing = TEMPLATE_HEADERS.filter((h) => h !== "Pembahasan" && !rows.some((r) => r[h] !== undefined));
  for (const h of missing) errors.push(`Kolom wajib "${h}" tidak ditemukan pada header.`);
  if (missing.length > 0) return { questions: [], errors, fileName: file.name };

  if (rows.length !== 30) errors.push(`Jumlah soal harus tepat 30 — ditemukan ${rows.length} baris.`);

  const seen = new Set<number>();
  rows.forEach((r, i) => {
    const no = parseInt(r["Nomor"], 10);
    const label = Number.isFinite(no) ? `Soal ${no}` : `Baris ${i + 2}`;
    if (!Number.isFinite(no) || no < 1 || no > 30) errors.push(`${label}: Nomor harus angka 1–30.`);
    else if (seen.has(no)) errors.push(`${label}: Nomor soal kembar.`);
    else seen.add(no);

    const type = normType(r["Jenis Soal"] ?? "");
    if (!type) errors.push(`${label}: Jenis Soal "${r["Jenis Soal"]}" tidak valid (gunakan PG / BENAR_SALAH / ISIAN / URAIAN).`);
    const text = r["Pertanyaan"] ?? "";
    if (!text) errors.push(`${label}: Pertanyaan kosong.`);
    const options = [r["Opsi A"] ?? "", r["Opsi B"] ?? "", r["Opsi C"] ?? "", r["Opsi D"] ?? ""];
    let key = (r["Kunci Jawaban"] ?? "").trim();
    if (!key) errors.push(`${label}: Kunci Jawaban kosong.`);

    if (type === "PG") {
      options.forEach((o, oi) => { if (!o) errors.push(`${label}: Opsi ${"ABCD"[oi]} kosong (soal PG wajib 4 pilihan).`); });
      key = key.toUpperCase();
      if (key && !["A", "B", "C", "D"].includes(key)) errors.push(`${label}: Kunci PG harus A / B / C / D (tertulis "${key}").`);
    } else if (type === "BENAR_SALAH") {
      key = key.toUpperCase();
      if (key && key !== "BENAR" && key !== "SALAH") errors.push(`${label}: Kunci BENAR_SALAH harus BENAR atau SALAH (tertulis "${key}").`);
    }
    if (type && text && key) {
      questions.push({ no: Number.isFinite(no) ? no : i + 1, type, text, options, key, explanation: r["Pembahasan"] ?? "" });
    }
  });
  for (let n = 1; n <= 30; n++) if (!seen.has(n)) errors.push(`Soal ${n}: nomor ini tidak ada dalam file.`);

  questions.sort((a, b) => a.no - b.no);
  const fatal = errors.filter((e) => !e.startsWith('Sheet "BANK SOAL"'));
  return { questions: fatal.length === 0 ? questions : [], errors, fileName: file.name };
}

export function exportResultsExcel(s: GameState) {
  const ranked = rankGroups(s.groups);
  const gname = (id: number | null) => s.groups.find((g) => g.id === id)?.name ?? "-";
  const wb = XLSX.utils.book_new();

  const rekap = [
    ["Peringkat", "Nama Kelompok", "Total Poin", "Jawaban Benar", "Jawaban Salah", "Bonus Point", "Double Point", "Tantangan Berhasil"],
    ...ranked.map((g) => [g.rank, g.name, g.points, g.correct, g.wrong, g.bonusCount, g.doubleCount, g.challengeCount]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(rekap);
  ws1["!cols"] = [{ wch: 10 }, { wch: 26 }, { wch: 11 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 13 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, "REKAP SKOR");

  const riwayat = [
    ["Nomor Soal", "Kotak", "Pertanyaan", "Jenis", "Kelompok Pemilih", "Dilempar", "Kelompok Penjawab", "Nilai Kotak", "Kejutan", "Status", "Jawaban", "Poin Diperoleh"],
    ...s.history.map((h) => [
      h.questionNo, h.boxNo, h.questionText, h.type, gname(h.pickerId), h.firstWrong ? "YA" : "TIDAK",
      h.answererId !== null ? gname(h.answererId) : "-", h.value, SURPRISE_LABEL[h.surprise ?? ""] ?? h.surprise,
      h.status, h.chosen || "-", h.totalPts,
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(riwayat);
  ws2["!cols"] = [{ wch: 10 }, { wch: 7 }, { wch: 55 }, { wch: 13 }, { wch: 20 }, { wch: 9 }, { wch: 20 }, { wch: 11 }, { wch: 17 }, { wch: 10 }, { wch: 30 }, { wch: 13 }];
  XLSX.utils.book_append_sheet(wb, ws2, "RIWAYAT PERMAINAN");

  const rincian: (string | number)[][] = [
    ["Nomor Soal", "Kotak", "Kelompok", "Poin Soal", "Bonus (+50)", "Double Point", "Tantangan (+50)", "Total Perubahan"],
    ...s.history.filter((h) => h.status === "BENAR").map((h) => [
      h.questionNo, h.boxNo, gname(h.answererId), h.basePts, h.bonusPts, h.doublePts, h.challengePts, h.totalPts,
    ]),
  ];
  if (s.adjustments.length > 0) {
    rincian.push([], ["KOREKSI POIN OLEH GURU"], ["Waktu", "Kelompok", "Perubahan"]);
    for (const adj of s.adjustments) {
      rincian.push([new Date(adj.at).toLocaleTimeString("id-ID"), gname(adj.groupId), adj.delta]);
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet(rincian);
  ws3["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 24 }, { wch: 11 }, { wch: 12 }, { wch: 13 }, { wch: 15 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, "RINCIAN NILAI");

  const date = new Date(s.startedAt ?? Date.now()).toISOString().slice(0, 10);
  XLSX.writeFile(wb, `MYSTERY-BOX-Hasil-${date}.xlsx`);
}