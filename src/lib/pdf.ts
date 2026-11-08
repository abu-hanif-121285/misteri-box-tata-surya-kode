import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { GameState } from "../types";
import { rankGroups } from "./engine";

const NAVY: [number, number, number] = [8, 17, 43];
const GOLD: [number, number, number] = [245, 167, 0];

export function buildResultsPdf(s: GameState): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const gname = (id: number | null) => s.groups.find((g) => g.id === id)?.name ?? "-";
  const ranked = rankGroups(s.groups);
  const tanggal = new Date(s.startedAt ?? Date.now()).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const surLabel: Record<string, string> = { BONUS: "Bonus", DOUBLE: "Double", CHALLENGE: "Tantangan" };

  const header = (subtitle: string) => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 30, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, 30, W, 1.6, "F");
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MYSTERY BOX", 14, 13);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Buka Kotaknya, Pecahkan Misterinya!", 14, 19);
    doc.text(subtitle, 14, 25);
    doc.setTextColor(30, 30, 30);
  };

  header(`Laporan Hasil Permainan  •  ${tanggal}`);
  const juara = ranked.filter((g) => g.rank === 1);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Juara: ${juara.map((g) => `${g.name} (${g.points} poin)`).join(", ") || "-"}`, 14, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Jumlah kelompok: ${s.groups.length}   •   Kotak dimainkan: ${s.history.length} dari 30   •   Soal benar: ${s.history.filter((h) => h.status === "BENAR").length}`, 14, 46);

  autoTable(doc, {
    startY: 51,
    head: [["Peringkat", "Kelompok", "Poin", "Benar", "Salah", "Bonus", "Double", "Tantangan"]],
    body: ranked.map((g) => [g.rank, g.name, g.points, g.correct, g.wrong, g.bonusCount, g.doubleCount, g.challengeCount]),
    theme: "grid",
    headStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 244, 230] },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (y > 240) { doc.addPage(); header("Riwayat Permainan (lanjutan)"); y = 38; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Riwayat Permainan", 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["No Soal", "Kotak", "Pemilih", "Penjawab", "Nilai", "Kejutan", "Status", "Poin"]],
    body: s.history.map((h) => [
      h.questionNo, h.boxNo, gname(h.pickerId),
      h.answererId !== null ? gname(h.answererId) : (h.firstWrong ? "Gugur (2× salah)" : "-"),
      h.value, h.surprise ? surLabel[h.surprise] : "-", h.status, h.totalPts,
    ]),
    theme: "striped",
    headStyles: { fillColor: NAVY, textColor: GOLD },
    styles: { fontSize: 8, cellPadding: 1.6 },
    columnStyles: { 2: { cellWidth: 30 }, 3: { cellWidth: 34 } },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (y > 235) { doc.addPage(); header("Rincian Nilai (lanjutan)"); y = 38; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Rincian Nilai", 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["No Soal", "Kelompok", "Poin Soal", "Bonus", "Double", "Tantangan", "Total"]],
    body: s.history.filter((h) => h.status === "BENAR").map((h) => [
      h.questionNo, gname(h.answererId), h.basePts, h.bonusPts, h.doublePts, h.challengePts, h.totalPts,
    ]),
    theme: "grid",
    headStyles: { fillColor: NAVY, textColor: GOLD },
    styles: { fontSize: 8.5, cellPadding: 1.8 },
  });

  if (s.adjustments.length > 0) {
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    if (y > 245) { doc.addPage(); header("Koreksi Poin (lanjutan)"); y = 38; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text("Koreksi Poin oleh Guru", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Waktu", "Kelompok", "Perubahan"]],
      body: s.adjustments.map((a) => [new Date(a.at).toLocaleTimeString("id-ID"), gname(a.groupId), (a.delta > 0 ? "+" : "") + a.delta]),
      theme: "grid",
      headStyles: { fillColor: NAVY, textColor: GOLD },
      styles: { fontSize: 8.5 },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("MYSTERY BOX — created by wiyanto abu hanif", 14, H - 7);
    doc.text(`Halaman ${i}/${pages}`, W - 14, H - 7, { align: "right" });
  }
  return doc;
}

export function exportResultsPdf(s: GameState) {
  const date = new Date(s.startedAt ?? Date.now()).toISOString().slice(0, 10);
  buildResultsPdf(s).save(`MYSTERY-BOX-Hasil-${date}.pdf`);
}
