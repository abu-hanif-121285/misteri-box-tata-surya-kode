import type { CSSProperties } from "react";
import type { GameState, ViewMode } from "../types";
import { rankGroups } from "../lib/engine";
import { GroupChip, MysteryBoxVisual } from "./ui";
import { cn } from "../utils/cn";

export function Scoreboard({ s, compact }: { s: GameState; compact?: boolean }) {
  const ranked = rankGroups(s.groups);
  const max = Math.max(1, ...s.groups.map((g) => g.points));
  const activeId = s.groups[s.turn]?.id;
  return (
    <div className={cn("flex gap-2.5", compact ? "flex-row overflow-x-auto pb-2" : "flex-col")}>
      {ranked.map((g) => (
        <div key={g.id}
          className={cn("panel-flat relative shrink-0 overflow-hidden rounded-xl p-2.5 transition-all", compact ? "w-52" : "w-full", g.id === activeId && s.phase !== "finished" && "ring-2")}
          style={{ borderColor: g.color + "66", "--gc": g.color, boxShadow: g.id === activeId ? `0 0 18px ${g.color}44` : undefined } as CSSProperties}>
          <div className="absolute inset-y-0 left-0 opacity-20 transition-all duration-700" style={{ width: `${(g.points / max) * 100}%`, background: `linear-gradient(90deg, ${g.color}, transparent)` }} />
          <div className="relative flex items-center gap-2">
            <span className="font-display w-6 text-center text-sm text-white/60">{g.rank === 1 && g.points > 0 ? "👑" : g.rank}</span>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
            <span className="truncate text-sm font-black" style={{ color: g.color }}>{g.name}</span>
            <span key={g.points} className="font-display score-bump ml-auto text-xl text-gold-300">{g.points}</span>
          </div>
          <div className="relative mt-1 flex gap-2 pl-8 text-[10px] font-bold text-white/60">
            <span title="Jawaban benar" className="text-limex">✓{g.correct}</span>
            <span title="Jawaban salah" className="text-danger">✗{g.wrong}</span>
            <span title="Bonus Point">🎁{g.bonusCount}</span>
            <span title="Double Point">✖{g.doubleCount}</span>
            <span title="Tantangan berhasil">⚡{g.challengeCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GameBoard({ s, view, unlocked, muted, sessionCode, online, onPick, onMute, onToggleView, onLock, onLockTeacher, onHelp, onTeacher }: {
  s: GameState; view: ViewMode; unlocked: boolean; muted: boolean;
  sessionCode: string | null; online: boolean;
  onPick: (i: number) => void; onMute: () => void; onToggleView: () => void;
  onLock: () => void; onLockTeacher: () => void; onHelp: () => void; onTeacher: () => void;
}) {
  const turnGroup = s.groups[s.turn];
  return (
    <div className="relative z-10 min-h-screen">
      {/* ===== Header tetap ===== */}
      <header className="sticky top-0 z-30 border-b border-gold-500/25 bg-navy-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:px-5">
          <span className="font-display gold-text text-base sm:text-xl">🎁 MYSTERY BOX</span>
          <span className="rounded-full border border-cyanx/25 bg-cyanx/10 px-2.5 py-0.5 text-[11px] font-bold text-cyanx sm:text-xs">
            KOTAK {s.openedCount}/30
          </span>
          <span className="hidden rounded-full border border-violetx/25 bg-violetx/10 px-2.5 py-0.5 text-[11px] font-bold text-violetx md:inline">
            🪐 TATA SURYA
          </span>
          {sessionCode && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-black", online ? "bg-limex/15 text-limex" : "bg-warn/15 text-warn")}>
              📡 {sessionCode} {online ? "• tersambung" : "• offline"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {view === "guru" && unlocked && (
              <button onClick={onTeacher} className="btn-gold rounded-lg px-3 py-1.5 text-xs sm:text-sm">🎛 PANEL GURU</button>
            )}
            {unlocked ? (
              <>
                <button onClick={onToggleView} className="btn-navy rounded-lg px-3 py-1.5 text-xs sm:text-sm" title="Ganti mode tampilan">
                  {view === "guru" ? "📽 PROYEKTOR" : "🔐 GURU"}
                </button>
                <button onClick={onLockTeacher} className="btn-navy rounded-lg px-3 py-1.5 text-xs sm:text-sm" title="Kunci Mode Guru — password diperlukan lagi untuk akses guru">🔒</button>
              </>
            ) : (
              <button onClick={onLock} className="btn-navy rounded-lg px-3 py-1.5 text-xs sm:text-sm" title="Masuk Mode Guru (password)">🔑</button>
            )}
            <button onClick={onMute} className="btn-navy rounded-lg px-3 py-1.5 text-sm" title={muted ? "Nyalakan audio" : "Matikan semua audio"}>
              {muted ? "🔇" : "🔊"}
            </button>
            <button onClick={onHelp} className="btn-navy hidden rounded-lg px-3 py-1.5 text-sm sm:block" title="Petunjuk">❓</button>
          </div>
        </div>
      </header>

      {/* ===== Banner giliran ===== */}
      {s.phase === "pick" && turnGroup && (
        <div className="mx-auto mt-3 flex max-w-[1500px] flex-wrap items-center justify-center gap-3 px-4">
          <span className="text-sm font-black tracking-widest text-white/70 sm:text-lg">🎯 GILIRAN</span>
          <GroupChip group={turnGroup} active big />
          <span className="text-sm font-black tracking-wide text-gold-300 sm:text-lg">— PILIH SATU KOTAK!</span>
        </div>
      )}

      {/* ===== Papan + Skor ===== */}
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-3 py-4 sm:px-5 xl:flex-row">
        <main className="flex-1">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
            {s.boxes.map((b, i) => (
              <button
                key={b.id}
                disabled={b.opened || s.phase !== "pick" || s.paused}
                onClick={() => onPick(i)}
                className={cn("mbox-wrap mbox-btn no-select relative rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-cyanx", (b.opened || s.phase !== "pick") && "cursor-default")}
                aria-label={`Kotak ${b.id}, ${b.value} poin${b.opened ? ", sudah dibuka" : ""}`}
              >
                <MysteryBoxVisual number={b.id} value={b.value} opened={b.opened} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] font-bold text-white/40">
            Kotak yang sudah terbuka tidak dapat dipilih lagi • Nilai & kejutan diacak setiap permainan
          </p>
        </main>

        <aside className="xl:w-80">
          <h2 className="font-display mb-2 text-sm tracking-wider text-gold-400">🏆 PAPAN SKOR</h2>
          <div className="hidden xl:block"><Scoreboard s={s} /></div>
          <div className="xl:hidden"><Scoreboard s={s} compact /></div>
        </aside>
      </div>

      <footer className="pb-4 text-center text-[10px] font-bold tracking-wide text-white/30">
        MYSTERY BOX — created by wiyanto abu hanif
      </footer>
    </div>
  );
}
