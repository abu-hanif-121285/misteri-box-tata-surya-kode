import { useEffect, useState, type ReactNode } from "react";
import type { GameAction, GameState, ViewMode } from "../types";
import { SURPRISE_META } from "../types";
import { checkAuto, currentQuestion } from "../lib/engine";
import { CHALLENGE_CATEGORY_META } from "../data/challenges";
import { GroupChip, MysteryBoxVisual, Sparkles, TimerRing, TypeBadge } from "./ui";
import { audio } from "../lib/audio";
import { cn } from "../utils/cn";

type Dispatch = (a: GameAction) => void;

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-navy-950/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center px-4 py-6">{children}</div>
    </div>
  );
}

/* ================= OPENING ================= */
function Opening({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const [step, setStep] = useState(0);
  const box = s.currentBox !== null ? s.boxes[s.currentBox] : null;
  useEffect(() => {
    setStep(0);
    const t1 = window.setTimeout(() => setStep(1), 950);
    const t2 = window.setTimeout(() => dispatch({ type: "OPEN_DONE" }), box?.surprise ? 2600 : 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.currentBox]);
  if (!box) return null;
  const meta = box.surprise ? SURPRISE_META[box.surprise] : null;
  return (
    <Overlay>
      <p className="font-display mb-4 text-lg tracking-widest text-gold-300 sm:text-2xl">KOTAK #{box.id} • {box.value} POIN</p>
      <div className="relative">
        <div className={cn("mbox-wrap w-52 sm:w-72", step === 0 && "animate-pulse")}>
          <MysteryBoxVisual number={box.id} value={box.value} picked={step === 0} lidOpen={step >= 1} />
        </div>
        {step >= 1 && (<><div className="light-burst" /><Sparkles count={26} /></>)}
      </div>
      {step >= 1 && meta && (
        <div className="pop-in mt-8 rounded-2xl border-2 px-6 py-4 text-center" style={{ borderColor: meta.color, background: meta.color + "18", boxShadow: `0 0 40px ${meta.color}55` }}>
          <p className="font-display text-2xl sm:text-4xl" style={{ color: meta.color }}>{meta.icon} {meta.label}!</p>
          <p className="mt-1 text-sm font-bold text-white/85 sm:text-base">{meta.desc}</p>
        </div>
      )}
      {step >= 1 && !meta && <p className="rise-in mt-8 text-lg font-black text-white/70">Tidak ada kejutan — fokuskan pikiranmu! 🧠</p>}
    </Overlay>
  );
}

/* ================= THROW ================= */
function ThrowNotice({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const [spin, setSpin] = useState(true);
  const [shown, setShown] = useState(s.groups[0]?.name ?? "");
  const target = s.groups.find((g) => g.id === s.answerer);
  useEffect(() => {
    setSpin(true);
    const iv = window.setInterval(() => {
      setShown(s.groups[Math.floor(Math.random() * s.groups.length)]?.name ?? "");
    }, 90);
    const t1 = window.setTimeout(() => { setSpin(false); clearInterval(iv); }, 1500);
    const t2 = window.setTimeout(() => dispatch({ type: "THROW_DONE" }), 2900);
    return () => { clearInterval(iv); clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.currentBox, s.answerer]);
  if (!target) return null;
  return (
    <Overlay>
      <p className="font-display flash-in text-center text-3xl text-warn sm:text-5xl" style={{ textShadow: "0 0 30px rgba(255,176,32,0.6)" }}>
        💫 LEMPARAN SOAL!
      </p>
      <p className="mt-3 text-center text-base font-bold text-white/75 sm:text-lg">
        Jawaban belum tepat — soal dilempar ke kelompok lain secara acak…
      </p>
      <div className={cn("mt-8 rounded-2xl border-4 px-10 py-6 text-center", spin ? "border-warn/60 slot-spin" : "pop-in")}
        style={spin ? undefined : { borderColor: target.color, background: target.color + "15", boxShadow: `0 0 50px ${target.color}66` }}>
        <p className="font-display text-3xl sm:text-5xl" style={{ color: spin ? "#ffb020" : target.color }}>{spin ? shown : target.name}</p>
      </div>
      {!spin && (
        <p className="rise-in mt-6 text-center text-sm font-black text-white/80 sm:text-lg">
          KESEMPATAN KEDUA • {s.settings.answerTime} DETIK • Nilai penuh tetap berlaku!
        </p>
      )}
    </Overlay>
  );
}

/* ================= QUESTION ================= */
function QuestionView({ s, dispatch, view }: { s: GameState; dispatch: Dispatch; view: ViewMode }) {
  const q = currentQuestion(s);
  const box = s.currentBox !== null ? s.boxes[s.currentBox] : null;
  const group = s.groups.find((g) => g.id === s.answerer);
  if (!q || !box || !group) return null;
  const meta = box.surprise ? SURPRISE_META[box.surprise] : null;
  const manual = q.type === "ISIAN" || q.type === "URAIAN";
  const answer = (chosen: string) => { audio.click(); dispatch({ type: "RESOLVE", correct: checkAuto(q, chosen), chosen }); };
  const grade = (correct: boolean) => { audio.click(); dispatch({ type: "RESOLVE", correct, chosen: correct ? "Dinilai BENAR oleh guru" : "Dinilai SALAH oleh guru" }); };

  return (
    <Overlay>
      <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="font-display rounded-xl bg-gold-500/15 px-3 py-1.5 text-sm text-gold-300 sm:text-lg">KOTAK #{box.id} • {box.value} POIN</span>
        <TypeBadge type={q.type} />
        {meta && <span className="font-display rounded-xl px-3 py-1.5 text-xs sm:text-sm" style={{ background: meta.color + "20", color: meta.color }}>{meta.icon} {meta.label}</span>}
        <span className={cn("rounded-xl px-3 py-1.5 text-xs font-black sm:text-sm", s.attempt === 1 ? "bg-cyanx/15 text-cyanx" : "bg-warn/15 text-warn")}>
          KESEMPATAN {s.attempt}/2
        </span>
      </div>

      <div className="mt-4 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black tracking-widest text-white/60 sm:text-sm">MENJAWAB:</span>
          <GroupChip group={group} active big />
        </div>
        <TimerRing timeLeft={s.timeLeft} total={s.timerTotal} size={120} />
      </div>

      <div className="panel mt-4 w-full rounded-2xl p-5 text-center sm:p-8">
        <p className="font-extrabold leading-snug text-white" style={{ fontSize: "clamp(1.25rem, 3.4vw, 2.3rem)" }}>{q.text}</p>
      </div>

      {q.type === "PG" && (
        <div className="mt-4 grid w-full gap-2.5 sm:grid-cols-2 sm:gap-3">
          {q.options.map((o, i) => (
            <button key={i} onClick={() => answer("ABCD"[i])} disabled={s.paused}
              className="btn-navy flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left sm:py-4">
              <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500 text-lg text-navy-900">{"ABCD"[i]}</span>
              <span className="text-base font-extrabold text-white sm:text-xl" style={{ fontFamily: "var(--font-body)" }}>{o}</span>
            </button>
          ))}
        </div>
      )}

      {q.type === "BENAR_SALAH" && (
        <div className="mt-5 grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4">
          <button onClick={() => answer("BENAR")} disabled={s.paused} className="btn-green rounded-2xl px-6 py-5 text-xl sm:text-3xl">⭕ BENAR</button>
          <button onClick={() => answer("SALAH")} disabled={s.paused} className="btn-danger rounded-2xl px-6 py-5 text-xl sm:text-3xl">❌ SALAH</button>
        </div>
      )}

      {manual && (
        <div className="mt-4 w-full max-w-2xl rounded-2xl border border-violetx/40 bg-violetx/10 p-4 text-center">
          <p className="text-lg font-black text-violetx sm:text-xl">🎤 Jawab secara lisan!</p>
          {view === "guru" ? (
            <>
              <p className="mt-1 text-xs font-bold text-white/60">Guru menilai jawaban kelompok (kunci ada di Panel Guru)</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button onClick={() => grade(true)} disabled={s.paused} className="btn-green rounded-xl px-4 py-3.5 text-lg sm:text-xl">✔ BENAR</button>
                <button onClick={() => grade(false)} disabled={s.paused} className="btn-danger rounded-xl px-4 py-3.5 text-lg sm:text-xl">✘ SALAH</button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm font-bold text-white/70">Guru sedang menilai melalui Mode Guru / remote… 🤫</p>
          )}
        </div>
      )}

      {view === "guru" && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => dispatch({ type: s.timerRunning ? "TIMER_PAUSE" : "TIMER_RESUME" })} className="btn-navy rounded-lg px-3 py-1.5 text-xs">
            {s.timerRunning ? "⏸ Jeda timer" : "▶ Lanjut timer"}
          </button>
          <button onClick={() => dispatch({ type: "TIMER_ADD", seconds: 10 })} className="btn-navy rounded-lg px-3 py-1.5 text-xs">＋10 detik</button>
          <button onClick={() => dispatch({ type: "SKIP" })} className="btn-navy rounded-lg px-3 py-1.5 text-xs">⏭ Lewati soal</button>
        </div>
      )}

      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-1.5 border-t border-white/10 pt-3">
        <span className="mr-1 text-[10px] font-black tracking-widest text-white/40">🏆 SKOR</span>
        {[...s.groups].sort((a, b) => b.points - a.points).map((g) => (
          <span key={g.id} className="rounded-full border px-2.5 py-0.5 text-[11px] font-black"
            style={{ borderColor: g.id === s.answerer ? g.color : g.color + "44", color: g.color, background: g.id === s.answerer ? g.color + "1e" : "rgba(6,13,36,0.6)" }}>
            {g.name} <span className="text-gold-300">{g.points}</span>
          </span>
        ))}
      </div>
    </Overlay>
  );
}

/* ================= CHALLENGE ================= */
function ChallengeView({ s, dispatch, view }: { s: GameState; dispatch: Dispatch; view: ViewMode }) {
  const c = s.challenge;
  const group = s.groups.find((g) => g.id === s.pending?.answererId);
  if (!c || !group) return null;
  const meta = CHALLENGE_CATEGORY_META[c.category];
  const showMemory = c.memoryWords && s.timeLeft > s.timerTotal - 7;
  return (
    <Overlay>
      <p className="font-display pop-in text-center text-2xl text-magentax sm:text-4xl" style={{ textShadow: "0 0 30px rgba(255,92,158,0.5)" }}>⚡ SPECIAL CHALLENGE</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <span className="font-display rounded-full border-2 px-4 py-1.5 text-sm sm:text-base" style={{ borderColor: meta.color, color: meta.color }}>{meta.icon} {c.category}</span>
        <GroupChip group={group} active big />
        <span className="rounded-full bg-limex/15 px-3 py-1 text-sm font-black text-limex">BONUS +50 POIN</span>
      </div>

      <div className="mt-5 flex w-full flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div className="panel max-w-2xl flex-1 rounded-2xl p-5 text-center sm:p-7">
          {c.emoji && <p className="mb-3" style={{ fontSize: "clamp(4rem, 12vw, 7rem)", lineHeight: 1 }}>{c.emoji}</p>}
          <p className="text-lg font-extrabold leading-snug text-white sm:text-2xl">{c.text}</p>
          {c.memoryWords && (
            <div className="mt-4">
              {showMemory ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {c.memoryWords.map((w) => (
                    <span key={w} className="font-display pop-in rounded-xl bg-violetx/20 px-4 py-2 text-xl text-violetx sm:text-2xl">{w}</span>
                  ))}
                </div>
              ) : (
                <p className="font-display pop-in text-xl text-warn sm:text-2xl">🙈 Kata disembunyikan — sebutkan sekarang!</p>
              )}
              {showMemory && <p className="mt-2 text-xs font-bold text-white/50">Hafalkan! Kata akan hilang dalam {Math.max(0, Math.ceil(s.timeLeft - (s.timerTotal - 7)))} detik…</p>}
            </div>
          )}
        </div>
        <TimerRing timeLeft={s.timeLeft} total={s.timerTotal} size={130} />
      </div>

      {view === "guru" ? (
        <div className="mt-6 grid w-full max-w-xl grid-cols-2 gap-3">
          <button onClick={() => { audio.click(); dispatch({ type: "CHALLENGE_GRADE", success: true }); }} className="btn-green rounded-2xl px-5 py-4 text-lg sm:text-2xl">🏅 BERHASIL (+50)</button>
          <button onClick={() => { audio.click(); dispatch({ type: "CHALLENGE_GRADE", success: false }); }} className="btn-danger rounded-2xl px-5 py-4 text-lg sm:text-2xl">💨 GAGAL (+0)</button>
        </div>
      ) : (
        <p className="mt-6 text-sm font-bold text-white/60">Guru menilai tantangan melalui Mode Guru / remote…</p>
      )}
      <p className="mt-3 text-xs font-bold text-white/45">Poin soal utama sudah aman — tantangan ini hanya menambah bonus!</p>
    </Overlay>
  );
}

/* ================= RESULT ================= */
function ResultView({ s, dispatch, view }: { s: GameState; dispatch: Dispatch; view: ViewMode }) {
  const r = s.lastResult;
  const q = currentQuestion(s);
  if (!r || !q) return null;
  const winner = s.groups.find((g) => g.id === r.winnerId);
  const picker = s.groups.find((g) => g.id === s.firstAnswerer);
  const showKey = s.settings.revealExplanation === "always" || (s.settings.revealExplanation === "teacher" && view === "guru");
  const isLast = s.openedCount >= s.boxes.length;
  const headline = r.status === "BENAR" ? "JAWABAN BENAR!" : r.status === "GUGUR" ? "SOAL GUGUR!" : "SOAL DILEWATI";
  const color = r.status === "BENAR" ? "#3ef08c" : r.status === "GUGUR" ? "#ff5252" : "#ffb020";
  return (
    <Overlay>
      <p className="font-display pop-in text-center text-4xl sm:text-6xl" style={{ color, textShadow: `0 0 40px ${color}88` }}>
        {r.status === "BENAR" ? "🎉" : r.status === "GUGUR" ? "💥" : "⏭"} {headline}
      </p>

      {r.status === "BENAR" && winner && (
        <div className="pop-in mt-5 flex flex-col items-center gap-3 rounded-2xl border-2 px-8 py-5 text-center" style={{ borderColor: winner.color, background: winner.color + "12", animationDelay: "0.15s" }}>
          <GroupChip group={winner} big />
          {r.thrown && <p className="text-xs font-black text-warn">💫 Berhasil lewat lemparan soal!</p>}
          <div className="space-y-1 text-sm font-bold text-white/85 sm:text-base">
            <p>Poin soal: <b className="text-gold-300">{r.basePts}</b></p>
            {r.doublePts > 0 && <p className="text-cyanx">✖ DOUBLE POINT: +{r.doublePts} ({r.basePts} × 2)</p>}
            {r.bonusPts > 0 && <p className="text-limex">🎁 BONUS POINT: +{r.bonusPts}</p>}
            {r.challengePts > 0 && <p className="text-magentax">⚡ TANTANGAN BERHASIL: +{r.challengePts}</p>}
          </div>
          <p className="font-display text-4xl text-gold-300 sm:text-5xl" style={{ textShadow: "0 0 25px rgba(255,201,60,0.6)" }}>+{r.totalPts} POIN</p>
        </div>
      )}

      {r.status !== "BENAR" && (
        <p className="mt-4 max-w-xl text-center text-base font-bold text-white/75 sm:text-lg">
          {r.status === "GUGUR"
            ? r.thrown ? `Dua kesempatan (${picker?.name ?? "?"} dan kelompok penerima) belum berhasil. Tidak ada poin yang diberikan.` : "Kesempatan menjawab tidak berhasil. Tidak ada poin yang diberikan."
            : "Soal dilewati oleh guru. Tidak ada poin yang diberikan."}
        </p>
      )}

      {showKey && (
        <div className="rise-in mt-5 w-full max-w-2xl rounded-2xl border border-cyanx/35 bg-cyanx/8 p-4 text-center" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs font-black tracking-widest text-cyanx">KUNCI JAWABAN {view === "guru" && s.settings.revealExplanation === "teacher" ? "(HANYA GURU)" : ""}</p>
          <p className="mt-1 text-lg font-extrabold text-white sm:text-xl">
            {q.type === "PG" ? `${q.key}. ${q.options["ABCD".indexOf(q.key)] ?? ""}` : q.key}
          </p>
          {q.explanation && <p className="mt-2 text-sm font-semibold italic text-white/70">💡 {q.explanation}</p>}
        </div>
      )}

      <button onClick={() => { audio.click(); dispatch({ type: "NEXT" }); }} className="btn-gold mt-7 rounded-2xl px-10 py-4 text-xl sm:text-2xl">
        {isLast ? "🏆 LIHAT HASIL AKHIR" : "▶ LANJUT"}
      </button>
    </Overlay>
  );
}

/* ================= ROUTER ================= */
export default function QuestionStage({ s, dispatch, view }: { s: GameState; dispatch: Dispatch; view: ViewMode }) {
  if (s.phase === "opening") return <Opening s={s} dispatch={dispatch} />;
  if (s.phase === "question") return <QuestionView s={s} dispatch={dispatch} view={view} />;
  if (s.phase === "throw") return <ThrowNotice s={s} dispatch={dispatch} />;
  if (s.phase === "challenge") return <ChallengeView s={s} dispatch={dispatch} view={view} />;
  if (s.phase === "result") return <ResultView s={s} dispatch={dispatch} view={view} />;
  return null;
}
