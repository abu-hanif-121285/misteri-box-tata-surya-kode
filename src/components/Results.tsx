import type { CSSProperties } from "react";
import type { GameState } from "../types";
import { rankGroups } from "../lib/engine";
import { exportResultsExcel } from "../lib/excel";
import { exportResultsPdf } from "../lib/pdf";
import { Confetti } from "./ui";
import { audio } from "../lib/audio";

const MEDALS: Record<number, { color: string; label: string; h: number; cls: string }> = {
  1: { color: "#ffc93c", label: "🥇 JUARA 1", h: 190, cls: "podium-1" },
  2: { color: "#cfd8e8", label: "🥈 JUARA 2", h: 140, cls: "podium-2" },
  3: { color: "#e0955c", label: "🥉 JUARA 3", h: 105, cls: "podium-3" },
};

export default function Results({ s, onNewGame }: { s: GameState; onNewGame: () => void }) {
  const ranked = rankGroups(s.groups);
  const topRanks = [...new Set(ranked.map((g) => g.rank))].sort((a, b) => a - b).slice(0, 3);
  const podiumOrder = [topRanks[1], topRanks[0], topRanks[2]].filter((r) => r !== undefined);
  const champions = ranked.filter((g) => g.rank === 1);
  const tanggal = new Date(s.startedAt ?? Date.now()).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const durasi = s.startedAt && s.endedAt ? Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000)) : null;

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <Confetti count={100} />
      <p className="text-center text-xs font-black tracking-[0.35em] text-cyanx"> PERTUNJUKAN SELESAI!</p>
      <h1 className="gold-text font-display mt-1 text-center" style={{ fontSize: "clamp(2.2rem, 7vw, 4.5rem)" }}>HASIL AKHIR</h1>
      <p className="mt-1 text-center text-sm font-bold text-white/60">{tanggal}{durasi ? ` • ${durasi} menit` : ""} • {s.history.length} kotak dimainkan</p>

      <div className="pop-in mx-auto mt-4 w-fit rounded-2xl border-2 border-gold-400 bg-gold-500/10 px-6 py-3 text-center" style={{ boxShadow: "0 0 45px rgba(255,201,60,0.35)" }}>
        <p className="text-[11px] font-black tracking-[0.3em] text-gold-300">🏆 {champions.length > 1 ? "JUARA BERSAMA" : "SANG JUARA"}</p>
        <p className="font-display text-2xl text-white sm:text-4xl">{champions.map((g) => g.name).join(" & ")}</p>
        <p className="font-display text-lg text-gold-300">{champions[0]?.points} POIN</p>
      </div>

      {/* ===== Podium ===== */}
      <div className="mx-auto mt-8 flex max-w-3xl items-end justify-center gap-2 sm:gap-4">
        {podiumOrder.map((rank, pos) => {
          const visualPos = rank === topRanks[0] ? 1 : pos === 0 ? 2 : pos === 2 || podiumOrder.length === 2 ? 3 : 2;
          const m = { ...MEDALS[visualPos], label: `${rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🎖"} JUARA ${rank}` };
          const groups = ranked.filter((g) => g.rank === rank);
          return (
            <div key={rank} className={`flex-1 ${m.cls}`}>
              <div className="mb-2 flex flex-col items-center gap-1">
                {rank === 1 && <span className="text-3xl">👑</span>}
                {groups.map((g) => (
                  <span key={g.id} className="max-w-full truncate rounded-full border-2 px-3 py-1 text-xs font-black sm:text-sm" style={{ borderColor: g.color, color: g.color, background: "rgba(6,13,36,0.85)" }}>
                    {g.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-col items-center justify-start rounded-t-2xl border-2 border-b-0 pt-3"
                style={{ height: m.h, borderColor: m.color, background: `linear-gradient(180deg, ${m.color}33, rgba(6,13,36,0.9))`, boxShadow: `0 0 30px ${m.color}44` } as CSSProperties}>
                <p className="font-display text-sm sm:text-lg" style={{ color: m.color }}>{m.label}</p>
                <p className="font-display text-2xl text-white sm:text-3xl">{groups[0]?.points}</p>
                <p className="text-[10px] font-bold text-white/50">POIN{groups.length > 1 ? " (SERI)" : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mx-auto h-2 max-w-3xl rounded-b bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

      {/* ===== Tabel lengkap ===== */}
      <div className="panel mt-8 overflow-x-auto rounded-2xl p-4">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-gold-500/30 text-[11px] font-black tracking-wider text-gold-300">
              <th className="py-2 pr-2">RANK</th><th className="pr-2">KELOMPOK</th><th className="pr-2 text-right">POIN</th>
              <th className="pr-2 text-center text-limex">✓ BENAR</th><th className="pr-2 text-center text-danger">✗ SALAH</th>
              <th className="pr-2 text-center">🎁 BONUS</th><th className="pr-2 text-center">✖ DOUBLE</th><th className="text-center">⚡ TANTANGAN</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((g) => (
              <tr key={g.id} className="border-b border-white/5 font-bold">
                <td className="py-2.5 pr-2 font-display text-gold-400">{g.rank === 1 ? "👑 1" : g.rank}</td>
                <td className="pr-2"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.color }} /><span style={{ color: g.color }}>{g.name}</span></td>
                <td className="pr-2 text-right font-display text-lg text-gold-300">{g.points}</td>
                <td className="pr-2 text-center">{g.correct}</td><td className="pr-2 text-center">{g.wrong}</td>
                <td className="pr-2 text-center">{g.bonusCount}</td><td className="pr-2 text-center">{g.doubleCount}</td><td className="text-center">{g.challengeCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-white/45">Nilai sama memperoleh peringkat yang sama — tidak ada pemenang tambahan yang diacak.</p>
      </div>

      {/* ===== Ekspor ===== */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button onClick={() => { audio.click(); exportResultsPdf(s); }} className="btn-gold rounded-2xl px-5 py-4 text-base sm:text-lg">📄 DOWNLOAD PDF</button>
        <button onClick={() => { audio.click(); exportResultsExcel(s); }} className="btn-gold rounded-2xl px-5 py-4 text-base sm:text-lg">📊 DOWNLOAD EXCEL</button>
        <button onClick={onNewGame} className="btn-navy rounded-2xl px-5 py-4 text-base sm:text-lg">🔄 PERMAINAN BARU</button>
      </div>
      <p className="mt-3 text-center text-xs font-bold text-warn">⚠ Data sesi hanya tersimpan selama aplikasi terbuka (tanpa database permanen). Ekspor laporan sekarang!</p>
      <p className="mt-4 pb-2 text-center text-xs font-bold tracking-wide text-gold-400/80">MYSTERY BOX — created by wiyanto abu hanif</p>
    </div>
  );
}
