import { useState } from "react";
import type { GameAction, GameState, ViewMode } from "../types";
import { currentQuestion } from "../lib/engine";
import { clearFirebaseConfig, isFirebaseConfigured, loadFirebaseConfig, saveFirebaseConfig } from "../lib/firebase";
import { Toggle, TypeBadge } from "./ui";
import { cn } from "../utils/cn";

export interface AudioCtl {
  muted: boolean; musicOn: boolean; musicVol: number; sfxVol: number;
  setMuted: (v: boolean) => void; setMusicOn: (v: boolean) => void;
  setMusicVol: (v: number) => void; setSfxVol: (v: number) => void;
}

const TABS = ["🎮 Kontrol", "⏱ Timer", "📝 Soal", "🏆 Skor", "📺 Tampilan", "📡 Sesi", "🔐 Keamanan"] as const;

const PHASE_LABEL: Record<string, string> = {
  pick: "Memilih kotak", opening: "Membuka kotak", question: "Menjawab soal", throw: "Lemparan soal",
  challenge: "Tantangan khusus", result: "Hasil soal", finished: "Selesai",
};

export default function TeacherPanel({ s, dispatch, view, setView, audioCtl, password, onChangePassword, host, onHostStart, onHostStop, onEndGame, onNewGame, onLock, onClose }: {
  s: GameState; dispatch: (a: GameAction) => void;
  view: ViewMode; setView: (v: ViewMode) => void;
  audioCtl: AudioCtl;
  password: string; onChangePassword: (pw: string) => void;
  host: { active: boolean; code: string | null; online: boolean };
  onHostStart: () => void; onHostStop: () => void;
  onEndGame: () => void; onNewGame: () => void; onLock: () => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [timerInput, setTimerInput] = useState(60);
  const [cfgText, setCfgText] = useState(() => JSON.stringify(loadFirebaseConfig() ?? {}, null, 2));
  const [cfgMsg, setCfgMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [configured, setConfigured] = useState(isFirebaseConfigured());
  const [pwCur, setPwCur] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const q = currentQuestion(s);
  const inTimer = s.phase === "question" || s.phase === "challenge";
  const manual = q !== null && (q.type === "ISIAN" || q.type === "URAIAN");
  const answerer = s.groups.find((g) => g.id === s.answerer);
  const picker = s.groups.find((g) => g.id === s.firstAnswerer);

  const btn = "rounded-xl px-3 py-2.5 text-xs sm:text-sm";
  const card = "rounded-xl bg-navy-900/70 border border-gold-500/15 p-3";

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-l-2xl">
        <div className="flex items-center justify-between border-b border-gold-500/25 p-4">
          <h2 className="font-display text-lg text-gold-400">🎛 PANEL GURU</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyanx/15 px-2.5 py-1 text-[10px] font-black text-cyanx">{PHASE_LABEL[s.phase]}{s.paused ? " • JEDA" : ""}</span>
            <button onClick={onClose} className="btn-navy rounded-lg px-3 py-1 text-sm">✕</button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-gold-500/15 px-2 py-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition", tab === t ? "bg-gold-500 text-navy-900" : "bg-navy-800 text-white/70 hover:text-gold-300")}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {tab === "🎮 Kontrol" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-navy" style={{ borderRadius: 12, padding: "10px 12px", fontSize: 13 }} onClick={() => dispatch({ type: s.paused ? "GAME_RESUME" : "GAME_PAUSE" })}>
                  {s.paused ? "▶ LANJUTKAN GAME" : "⏸ JEDA GAME"}
                </button>
                <button className={cn(btn, "btn-gold")} disabled={s.phase !== "result"} onClick={() => dispatch({ type: "NEXT" })}>⏭ SOAL BERIKUTNYA</button>
                <button className={cn(btn, "btn-navy")} disabled={!["question", "throw", "challenge"].includes(s.phase)} onClick={() => dispatch({ type: "SKIP" })}>⏩ LEWATI SOAL</button>
                <button className={cn(btn, "btn-navy")} disabled={!["opening", "question", "throw"].includes(s.phase)} onClick={() => dispatch({ type: "CANCEL" })}>↩ BATALKAN SOAL</button>
              </div>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">PENILAIAN MANUAL (ISIAN / URAIAN)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className={cn(btn, "btn-green")} disabled={s.phase !== "question" || !manual} onClick={() => dispatch({ type: "RESOLVE", correct: true, chosen: "Dinilai BENAR oleh guru" })}>✔ BENAR</button>
                  <button className={cn(btn, "btn-danger")} disabled={s.phase !== "question" || !manual} onClick={() => dispatch({ type: "RESOLVE", correct: false, chosen: "Dinilai SALAH oleh guru" })}>✘ SALAH</button>
                </div>
                <p className="mt-2 text-[11px] text-white/50">{manual ? `Kelompok menjawab: ${answerer?.name ?? "-"}` : "Soal PG & Benar/Salah dinilai otomatis oleh sistem."}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className={cn(btn, "btn-danger")} onClick={onEndGame}>🏁 AKHIRI PERMAINAN</button>
                <button className={cn(btn, "btn-navy")} onClick={onNewGame}>🔄 PERMAINAN BARU</button>
              </div>
              <p className="text-[11px] leading-relaxed text-white/45">Akhiri = langsung ke hasil akhir. Permainan baru = reset penuh sesi (dengan konfirmasi).</p>
            </>
          )}

          {tab === "⏱ Timer" && (
            <>
              <div className={cn(card, "text-center")}>
                <p className="font-display text-5xl text-gold-300">{Math.ceil(s.timeLeft)}<span className="text-base text-white/50"> dtk</span></p>
                <p className="mt-1 text-xs font-bold text-white/50">{inTimer ? (s.timerRunning ? "Berjalan" : "Dijeda") : "Timer aktif saat soal / tantangan"}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min={5} max={600} value={timerInput} onChange={(e) => setTimerInput(Number(e.target.value) || 60)}
                  className="w-24 rounded-xl border border-gold-500/30 bg-navy-900 px-3 py-2 text-center font-display text-gold-300 outline-none" />
                <button className={cn(btn, "btn-gold flex-1")} disabled={!inTimer} onClick={() => dispatch({ type: "TIMER_SET", seconds: timerInput })}>TERAPKAN DURASI</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className={cn(btn, "btn-navy")} disabled={!inTimer} onClick={() => dispatch({ type: "TIMER_ADD", seconds: 10 })}>＋10 DETIK</button>
                <button className={cn(btn, "btn-navy")} disabled={!inTimer} onClick={() => dispatch({ type: "TIMER_ADD", seconds: -10 })}>−10 DETIK</button>
                <button className={cn(btn, "btn-navy")} disabled={!inTimer} onClick={() => dispatch({ type: s.timerRunning ? "TIMER_PAUSE" : "TIMER_RESUME" })}>{s.timerRunning ? "⏸ PAUSE" : "▶ RESUME"}</button>
                <button className={cn(btn, "btn-navy")} disabled={!inTimer} onClick={() => dispatch({ type: "TIMER_RESET" })}>↺ RESET</button>
                <button className={cn(btn, "btn-danger col-span-2")} disabled={!inTimer} onClick={() => dispatch({ type: "TIMER_STOP" })}>⏹ HENTIKAN TIMER (anggap waktu habis)</button>
              </div>
            </>
          )}

          {tab === "📝 Soal" && (
            q ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={q.type} />
                  <span className="rounded-full bg-navy-800 px-2.5 py-1 text-[11px] font-black text-gold-300">Soal #{q.no} • Kotak #{s.currentBox !== null ? s.boxes[s.currentBox].id : "-"}</span>
                </div>
                <div className={card}><p className="text-sm font-bold text-white/95">{q.text}</p>
                  {q.type === "PG" && <div className="mt-2 space-y-1 text-xs text-white/75">{q.options.map((o, i) => <p key={i} className={q.key === "ABCD"[i] ? "font-black text-limex" : ""}>{"ABCD"[i]}. {o}</p>)}</div>}
                </div>
                <div className={cn(card, "border-limex/40")}>
                  <p className="text-[10px] font-black tracking-widest text-limex">🔑 KUNCI JAWABAN (RAHASIA GURU)</p>
                  <p className="mt-1 font-display text-lg text-limex">{q.key}</p>
                </div>
                {q.explanation && <div className={card}><p className="text-[10px] font-black tracking-widest text-cyanx">💡 PEMBAHASAN</p><p className="mt-1 text-xs font-semibold text-white/80">{q.explanation}</p></div>}
                <div className={card}>
                  <p className="text-xs font-bold text-white/70">Pemilih kotak: <b style={{ color: picker?.color }}>{picker?.name ?? "-"}</b></p>
                  <p className="text-xs font-bold text-white/70">Sedang menjawab: <b style={{ color: answerer?.color }}>{answerer?.name ?? "-"}</b> (kesempatan {s.attempt}/2)</p>
                </div>
              </>
            ) : <p className="py-8 text-center text-sm font-bold text-white/50">Belum ada soal aktif — pilih kotak terlebih dahulu.</p>
          )}

          {tab === "🏆 Skor" && (
            <>
              <p className="text-[11px] font-bold text-white/55">Koreksi poin manual. Semua perubahan tercatat di laporan (RINCIAN NILAI).</p>
              {s.groups.map((g) => (
                <div key={g.id} className={cn(card, "flex flex-wrap items-center gap-2")}>
                  <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                  <span className="text-sm font-black" style={{ color: g.color }}>{g.name}</span>
                  <span className="font-display ml-auto text-xl text-gold-300">{g.points}</span>
                  <div className="flex w-full gap-1.5">
                    {[-50, -10, 10, 50].map((d) => (
                      <button key={d} onClick={() => dispatch({ type: "ADJUST_SCORE", groupId: g.id, delta: d })}
                        className={cn("flex-1 rounded-lg px-2 py-1.5 text-xs font-black", d > 0 ? "bg-limex/15 text-limex hover:bg-limex/30" : "bg-danger/15 text-danger hover:bg-danger/30")}>
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "📺 Tampilan" && (
            <>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">MODE TAMPILAN</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setView("guru")} className={cn(btn, view === "guru" ? "btn-gold" : "btn-navy")}>🎛 MODE GURU</button>
                  <button onClick={() => setView("proyektor")} className={cn(btn, view === "proyektor" ? "btn-gold" : "btn-navy")}>📽 PROYEKTOR</button>
                </div>
                <p className="mt-2 text-[11px] text-white/50">Mode proyektor menyembunyikan kunci jawaban & kontrol administratif.</p>
              </div>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">AUDIO</p>
                <label className="text-xs font-bold text-white/75">🎵 Volume musik: {Math.round(audioCtl.musicVol * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={audioCtl.musicVol} onChange={(e) => audioCtl.setMusicVol(Number(e.target.value))} className="w-full" />
                <label className="text-xs font-bold text-white/75">🔔 Volume efek suara: {Math.round(audioCtl.sfxVol * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={audioCtl.sfxVol} onChange={(e) => audioCtl.setSfxVol(Number(e.target.value))} className="w-full" />
                <Toggle checked={audioCtl.musicOn} onChange={audioCtl.setMusicOn} label="Musik latar" />
                <Toggle checked={audioCtl.muted} onChange={audioCtl.setMuted} label="🔇 Mute semua audio" />
              </div>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">PEMBAHASAN SETELAH SOAL</p>
                <select value={s.settings.revealExplanation} onChange={(e) => dispatch({ type: "SET_REVEAL", value: e.target.value as GameState["settings"]["revealExplanation"] })}
                  className="w-full rounded-xl border border-gold-500/30 bg-navy-900 px-3 py-2 font-bold text-gold-300 outline-none">
                  <option value="always">Selalu tampilkan di proyektor</option>
                  <option value="teacher">Hanya di Mode Guru</option>
                  <option value="never">Jangan tampilkan</option>
                </select>
              </div>
            </>
          )}

          {tab === "📡 Sesi" && (
            <>
              <div className={cn(card, configured ? "border-limex/40" : "border-warn/40")}>
                <p className="text-sm font-black" style={{ color: configured ? "#3ef08c" : "#ffb020" }}>
                  {configured ? "✅ Firebase terkonfigurasi" : "⚠ Mode dua perangkat belum tersedia"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                  {configured
                    ? "Laptop ini dapat menjadi host. Ponsel guru masuk melalui tombol Remote di halaman awal."
                    : "Firebase belum dikonfigurasi. Mode satu perangkat tetap berfungsi penuh. Tempel konfigurasi proyek Firebase Anda di bawah untuk mengaktifkan sinkronisasi dua perangkat."}
                </p>
              </div>
              {host.active ? (
                <div className={cn(card, "text-center")}>
                  <p className="text-xs font-black tracking-widest text-white/60">KODE SESI</p>
                  <p className="font-display my-2 text-4xl tracking-[0.3em] text-gold-300">{host.code}</p>
                  <p className="text-xs font-bold" style={{ color: host.online ? "#3ef08c" : "#ffb020" }}>{host.online ? "🟢 Tersambung ke Firebase" : "🟠 Menunggu koneksi…"}</p>
                  <p className="mt-2 text-[11px] text-white/55">Buka aplikasi ini di ponsel → “Hubungkan Remote Guru” → masukkan kode.</p>
                  <button className={cn(btn, "btn-danger mt-3 w-full")} onClick={onHostStop}>AKHIRI SESI</button>
                </div>
              ) : (
                <button className={cn(btn, "btn-gold w-full")} disabled={!configured} onClick={onHostStart}>📡 BUAT SESI (LAPTOP SEBAGAI HOST)</button>
              )}
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">KONFIGURASI FIREBASE (JSON)</p>
                <textarea value={cfgText} onChange={(e) => setCfgText(e.target.value)} rows={6} spellCheck={false}
                  placeholder={'{\n  "apiKey": "…",\n  "databaseURL": "https://….firebaseio.com",\n  "projectId": "…"\n}'}
                  className="w-full rounded-xl border border-gold-500/30 bg-navy-950 p-2 font-mono text-[11px] text-cyanx outline-none" />
                {cfgMsg && <p className="mt-1 text-[11px] font-bold" style={{ color: cfgMsg.ok ? "#3ef08c" : "#ff5252" }}>{cfgMsg.text}</p>}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className={cn(btn, "btn-gold")} onClick={() => { const r = saveFirebaseConfig(cfgText); setCfgMsg({ ok: r.ok, text: r.message }); setConfigured(isFirebaseConfigured()); }}>💾 SIMPAN</button>
                  <button className={cn(btn, "btn-navy")} onClick={() => { clearFirebaseConfig(); setCfgText("{}"); setConfigured(false); setCfgMsg({ ok: true, text: "Konfigurasi dihapus. Mode dua perangkat nonaktif." }); onHostStop(); }}>🗑 HAPUS</button>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-white/45">Konfigurasi disimpan hanya di perangkat ini (localStorage). Panduan lengkap ada di menu Petunjuk → Firebase. Data sesi permainan tidak disimpan permanen.</p>
              </div>
            </>
          )}

          {tab === "🔐 Keamanan" && (
            <>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">GANTI PASSWORD GURU</p>
                <input type="password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} placeholder="Password saat ini"
                  className="mb-2 w-full rounded-xl border border-gold-500/30 bg-navy-950 px-3 py-2 font-bold outline-none" autoComplete="current-password" />
                <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Password baru (min. 4 karakter)"
                  className="mb-2 w-full rounded-xl border border-gold-500/30 bg-navy-950 px-3 py-2 font-bold outline-none" autoComplete="new-password" />
                {pwMsg && <p className="mb-2 text-[11px] font-bold" style={{ color: pwMsg.ok ? "#3ef08c" : "#ff5252" }}>{pwMsg.text}</p>}
                <button className={cn(btn, "btn-gold w-full")} onClick={() => {
                  if (pwCur !== password) { setPwMsg({ ok: false, text: "Password saat ini salah." }); return; }
                  if (pwNew.trim().length < 4) { setPwMsg({ ok: false, text: "Password baru minimal 4 karakter." }); return; }
                  onChangePassword(pwNew.trim());
                  setPwCur(""); setPwNew("");
                  setPwMsg({ ok: true, text: "Password berhasil diganti." });
                }}>🔑 GANTI PASSWORD</button>
              </div>
              <div className={card}>
                <p className="mb-2 text-xs font-black tracking-wider text-white/60">KUNCI AKSES GURU</p>
                <button className={cn(btn, "btn-danger w-full")} onClick={onLock}>🔒 KUNCI MODE GURU SEKARANG</button>
                <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                  Panel, persiapan permainan, upload / download template, dan preview soal langsung terkunci. Password diperlukan lagi untuk membukanya — layar siswa beralih ke Mode Proyektor.
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-white/50">
                ⚠ Password ini adalah pembatas akses antarmuka di sisi klien — bukan keamanan yang kuat terhadap orang yang dapat mengakses kode sumber. Keamanan autentikasi sesungguhnya membutuhkan backend/server.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
