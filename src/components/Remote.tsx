import { useState } from "react";
import type { GameAction } from "../types";
import { checkAuto } from "../lib/engine";
import { disconnectFirebase, isFirebaseConfigured, remoteJoin, remoteSend, type MirrorState } from "../lib/firebase";
import { Modal, TimerRing, TypeBadge } from "./ui";
import { cn } from "../utils/cn";

export default function Remote({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState<string | null>(null);
  const [mirror, setMirror] = useState<MirrorState | null>(null);
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configured = isFirebaseConfigured();

  async function join() {
    const c = code.trim().toUpperCase();
    if (c.length < 4) { setError("Masukkan kode sesi dari laptop host."); return; }
    setBusy(true); setError("");
    try {
      await remoteJoin(c, setMirror, setOnline);
      setJoined(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal terhubung ke sesi.");
    }
    setBusy(false);
  }

  async function leave() {
    await disconnectFirebase();
    setJoined(null); setMirror(null); setOnline(false);
  }

  const send = (a: GameAction) => { if (joined) void remoteSend(joined, a); };
  const q = mirror?.currentQuestion ?? null;
  const answerer = mirror?.groups.find((g) => g.id === mirror?.answerer);

  return (
    <Modal open={open} onClose={() => { if (joined) void leave(); onClose(); }} title="📱 REMOTE GURU (2 PERANGKAT)" wide>
      {!configured && (
        <div className="rounded-xl border border-warn/40 bg-warn/10 p-4">
          <p className="font-display text-sm text-warn">⚠ MODE DUA PERANGKAT BELUM TERSEDIA</p>
          <p className="mt-2 text-sm font-semibold text-white/75">
            Firebase belum dikonfigurasi di perangkat ini. Tempel konfigurasi Firebase melalui <b>Panel Guru → Sesi</b> (lihat Petunjuk → Firebase), lalu buka kembali menu ini.
            Mode satu perangkat tetap berfungsi penuh tanpa Firebase.
          </p>
        </div>
      )}

      {configured && !joined && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white/75">1️⃣ Di laptop (proyektor): <b>Panel Guru → Sesi → BUAT SESI</b>.<br />2️⃣ Masukkan kode sesi 6 huruf di bawah ini.</p>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="KODE SESI"
              className="font-display w-full rounded-xl border border-gold-500/40 bg-navy-950 px-4 py-3 text-center text-2xl tracking-[0.3em] text-gold-300 outline-none focus:border-gold-400" />
            <button onClick={() => void join()} disabled={busy} className="btn-gold rounded-xl px-5 text-sm">{busy ? "…" : "HUBUNGKAN"}</button>
          </div>
          {error && <p className="text-sm font-bold text-danger">⚠ {error}</p>}
        </div>
      )}

      {joined && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display rounded-lg bg-navy-800 px-3 py-1 text-sm tracking-[0.2em] text-gold-300">{joined}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", online ? "bg-limex/15 text-limex" : "bg-warn/15 text-warn")}>{online ? "🟢 tersambung" : "🟠 terputus"}</span>
            <button onClick={() => void leave()} className="btn-navy ml-auto rounded-lg px-3 py-1 text-xs">PUTUSKAN</button>
          </div>

          {!mirror ? (
            <p className="py-6 text-center text-sm font-bold text-white/60">Menunggu state dari host…</p>
          ) : (
            <>
              <div className="rounded-xl bg-navy-900/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black tracking-wider text-cyanx">FASE: {mirror.phase.toUpperCase()} • Kotak {mirror.openedCount}/30</p>
                  <p className="font-display text-lg text-gold-300">⏱ {Math.ceil(mirror.timeLeft)}d</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mirror.groups.map((g) => (
                    <span key={g.id} className="rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: g.color + "22", color: g.color }}>
                      {g.name}: {g.points}
                    </span>
                  ))}
                </div>
              </div>

              {mirror.phase === "pick" && (
                <div>
                  <p className="mb-2 text-xs font-black text-white/70">PILIH KOTAK UNTUK <span style={{ color: mirror.groups[mirror.turn]?.color }}>{mirror.groups[mirror.turn]?.name}</span></p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {mirror.boxes.map((b, i) => (
                      <button key={b.id} disabled={b.opened} onClick={() => send({ type: "PICK_BOX", index: i })}
                        className={cn("rounded-lg border py-2 text-xs font-black transition", b.opened ? "border-white/10 bg-navy-900 text-white/25" : "border-gold-500/50 bg-gold-500/15 text-gold-300 hover:bg-gold-500/35")}>
                        {b.id}<span className="block text-[9px] opacity-70">{b.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mirror.phase === "question" && q && (
                <div className="rounded-xl border border-cyanx/30 bg-navy-900/70 p-3">
                  <div className="flex flex-wrap items-center gap-2"><TypeBadge type={q.type} /><span className="text-[11px] font-black" style={{ color: answerer?.color }}>{answerer?.name} • kesempatan {mirror.attempt}/2</span></div>
                  <p className="mt-2 text-sm font-bold text-white/95">{q.text}</p>
                  {q.type === "PG" && <div className="mt-1 text-xs text-white/70">{q.options.map((o, i) => <p key={i}>{"ABCD"[i]}. {o}</p>)}</div>}
                  <p className="mt-2 rounded-lg bg-limex/10 px-2 py-1 text-xs font-black text-limex">🔑 Kunci: {q.key}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {q.type === "PG" ? (
                      ["A", "B", "C", "D"].map((L) => (
                        <button key={L} onClick={() => send({ type: "RESOLVE", correct: checkAuto(q, L), chosen: `Remote: ${L}` })} className="btn-navy rounded-xl py-2.5 text-sm">{L}</button>
                      ))
                    ) : q.type === "BENAR_SALAH" ? (
                      <>
                        <button onClick={() => send({ type: "RESOLVE", correct: checkAuto(q, "BENAR"), chosen: "Remote: BENAR" })} className="btn-green rounded-xl py-2.5 text-sm">BENAR</button>
                        <button onClick={() => send({ type: "RESOLVE", correct: checkAuto(q, "SALAH"), chosen: "Remote: SALAH" })} className="btn-danger rounded-xl py-2.5 text-sm">SALAH</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => send({ type: "RESOLVE", correct: true, chosen: "Dinilai BENAR (remote)" })} className="btn-green rounded-xl py-2.5 text-sm">✔ NILAI BENAR</button>
                        <button onClick={() => send({ type: "RESOLVE", correct: false, chosen: "Dinilai SALAH (remote)" })} className="btn-danger rounded-xl py-2.5 text-sm">✘ NILAI SALAH</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {mirror.phase === "challenge" && (
                <div className="rounded-xl border border-magentax/40 bg-navy-900/70 p-3">
                  <p className="font-display text-sm text-magentax">⚡ {mirror.challenge?.category}</p>
                  <p className="mt-1 text-sm font-bold text-white/90">{mirror.challenge?.text}</p>
                  {mirror.challenge?.answer && <p className="mt-1 text-xs font-black text-limex">🔑 {mirror.challenge.answer}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => send({ type: "CHALLENGE_GRADE", success: true })} className="btn-green rounded-xl py-2.5 text-sm">BERHASIL +50</button>
                    <button onClick={() => send({ type: "CHALLENGE_GRADE", success: false })} className="btn-danger rounded-xl py-2.5 text-sm">GAGAL +0</button>
                  </div>
                </div>
              )}

              {mirror.phase === "result" && (
                <button onClick={() => send({ type: "NEXT" })} className="btn-gold w-full rounded-xl py-3 text-base">▶ LANJUT KE SOAL BERIKUTNYA</button>
              )}
              {mirror.phase === "throw" && <p className="text-center text-sm font-bold text-warn">💫 Lemparan soal berlangsung…</p>}
              {mirror.phase === "opening" && <p className="text-center text-sm font-bold text-gold-300">📦 Kotak sedang dibuka…</p>}
              {mirror.phase === "finished" && <p className="text-center text-sm font-bold text-limex">🏁 Permainan selesai — lihat hasil di layar utama.</p>}

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => send({ type: mirror.timerRunning ? "TIMER_PAUSE" : "TIMER_RESUME" })} className="btn-navy rounded-xl py-2 text-xs">{mirror.timerRunning ? "⏸ TIMER" : "▶ TIMER"}</button>
                <button onClick={() => send({ type: "TIMER_ADD", seconds: 10 })} className="btn-navy rounded-xl py-2 text-xs">＋10d</button>
                <button onClick={() => send({ type: "SKIP" })} className="btn-navy rounded-xl py-2 text-xs">⏭ LEWATI</button>
              </div>
              <div className="flex items-center justify-center">
                <TimerRing timeLeft={mirror.timeLeft} total={mirror.timerTotal || 60} size={90} />
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
