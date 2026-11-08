import { useEffect, useReducer, useRef, useState } from "react";
import type { GameAction, GameSettings, Group, ViewMode } from "./types";
import { DEFAULT_QUESTIONS, DEFAULT_BANK_NAME } from "./data/questions";
import { gameReducer, initialState } from "./lib/engine";
import { audio } from "./lib/audio";
import { disconnectFirebase, hostEndSession, hostPublish, hostStartSession, makeSessionCode } from "./lib/firebase";
import Landing from "./components/Landing";
import Setup, { type BankInfo } from "./components/Setup";
import GameBoard from "./components/GameBoard";
import QuestionStage from "./components/QuestionStage";
import TeacherPanel, { type AudioCtl } from "./components/TeacherPanel";
import Results from "./components/Results";
import HelpModal from "./components/HelpModal";
import Remote from "./components/Remote";
import { Cosmos, Modal } from "./components/ui";

type Screen = "landing" | "setup" | "game" | "results";
type LoginIntent = "teacher" | "panel" | "view" | "newgame";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const [screen, setScreen] = useState<Screen>("landing");
  const [bank, setBank] = useState<BankInfo>({ questions: DEFAULT_QUESTIONS, name: DEFAULT_BANK_NAME });
  const [password, setPassword] = useState("Inovatif");
  const [unlocked, setUnlocked] = useState(false);
  const [view, setViewState] = useState<ViewMode>("guru");
  const [panelOpen, setPanelOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [login, setLogin] = useState<LoginIntent | null>(null);
  const [loginPw, setLoginPw] = useState("");
  const [loginErr, setLoginErr] = useState(false);
  const [confirm, setConfirm] = useState<"new" | "end" | null>(null);
  const [toast, setToast] = useState("");

  const [muted, setMutedState] = useState(false);
  const [musicOn, setMusicOnState] = useState(true);
  const [musicVol, setMusicVolState] = useState(0.55);
  const [sfxVol, setSfxVolState] = useState(0.85);

  const [hostActive, setHostActive] = useState(false);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [online, setOnline] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  /* ====== Timer loop (200 ms, berbasis waktu nyata) ====== */
  useEffect(() => {
    if (screen !== "game") return;
    let last = performance.now();
    const iv = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1.5, (now - last) / 1000);
      last = now;
      dispatch({ type: "TICK", dt });
    }, 200);
    return () => window.clearInterval(iv);
  }, [screen]);

  /* ====== Efek suara & transisi layar berdasar fase ====== */
  const prevPhase = useRef(state.phase);
  useEffect(() => {
    const prev = prevPhase.current;
    if (prev === state.phase) return;
    prevPhase.current = state.phase;
    if (state.phase === "opening") audio.open();
    else if (state.phase === "throw") audio.whoosh();
    else if (state.phase === "challenge") audio.challengeHit();
    else if (state.phase === "result" && state.lastResult) {
      const r = state.lastResult;
      if (prev === "challenge") {
        if (r.challengePts > 0) audio.bonus();
        else audio.click();
      } else if (r.status === "BENAR") {
        audio.correct();
        if (r.bonusPts > 0) window.setTimeout(() => audio.bonus(), 500);
        if (r.doublePts > 0) window.setTimeout(() => audio.double(), 500);
      } else if (r.status === "GUGUR") audio.wrong();
      else audio.click();
    } else if (state.phase === "finished") {
      audio.stopMusic();
      audio.win();
      setScreen("results");
      setPanelOpen(false);
    }
  }, [state.phase, state.lastResult]);

  /* ====== Bunyi hitung mundur ====== */
  const lastSec = useRef(-1);
  useEffect(() => {
    const sec = Math.ceil(state.timeLeft);
    if ((state.phase === "question" || state.phase === "challenge") && state.timerRunning && !state.paused && sec !== lastSec.current) {
      lastSec.current = sec;
      if (sec <= 10 && sec > 0) audio.tickTock(sec <= 3);
    }
  }, [state.timeLeft, state.phase, state.timerRunning, state.paused]);

  /* ====== Sinkronisasi host Firebase (throttle 500 ms) ====== */
  const lastPub = useRef(0);
  const pubTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!hostActive || !hostCode) return;
    const send = () => {
      lastPub.current = Date.now();
      void hostPublish(hostCode, stateRef.current).catch(() => setOnline(false));
    };
    const elapsed = Date.now() - lastPub.current;
    if (elapsed > 500) send();
    else {
      if (pubTimer.current) window.clearTimeout(pubTimer.current);
      pubTimer.current = window.setTimeout(send, 520 - elapsed);
    }
  }, [state, hostActive, hostCode]);

  /* ====== Peringatan sebelum menutup tab (data sesi tidak permanen) ====== */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (stateRef.current.history.length > 0 && stateRef.current.phase !== "finished") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ====== Area guru tidak boleh dirender tanpa password ====== */
  useEffect(() => {
    if (screen === "setup" && !unlocked) setScreen("landing");
  }, [screen, unlocked]);

  /* ====== Aksi ====== */
  const setView = (v: ViewMode) => {
    setViewState(v);
    if (v === "proyektor") setPanelOpen(false);
  };

  const audioCtl: AudioCtl = {
    muted, musicOn, musicVol, sfxVol,
    setMuted: (v) => { setMutedState(v); audio.setMuted(v); },
    setMusicOn: (v) => { setMusicOnState(v); audio.setMusicEnabled(v); },
    setMusicVol: (v) => { setMusicVolState(v); audio.setMusicVolume(v); },
    setSfxVol: (v) => { setSfxVolState(v); audio.setSfxVolume(v); audio.click(); },
  };

  function handleStart(groups: Group[], settings: GameSettings, pw: string) {
    setPassword(pw);
    dispatch({ type: "START_GAME", groups, questions: bank.questions, settings });
    setUnlocked(true);
    setViewState("guru");
    setScreen("game");
    audio.playMusic("game");
  }

  function submitLogin() {
    if (loginPw === password) {
      setUnlocked(true);
      setLoginErr(false);
      const intent = login;
      setLogin(null);
      setLoginPw("");
      audio.correct();
      if (intent === "teacher") { setScreen("setup"); audio.playMusic("intro"); }
      else if (intent === "panel") setPanelOpen(true);
      else if (intent === "view") setViewState("guru");
      else if (intent === "newgame") doReset();
    } else {
      setLoginErr(true);
      audio.wrong();
    }
  }

  /** Guru mengunci kembali akses — password dibutuhkan lagi untuk area guru. */
  function lockTeacher() {
    setUnlocked(false);
    setPanelOpen(false);
    setViewState("proyektor");
    if (screen === "setup") setScreen("landing");
    audio.click();
    setToast("🔒 Mode Guru dikunci. Password diperlukan untuk mengakses kembali.");
  }

  function requireTeacher(intent: LoginIntent) {
    if (unlocked) {
      if (intent === "teacher") setScreen("setup");
      else if (intent === "newgame") setConfirm("new");
    } else {
      setLogin(intent);
      setLoginErr(false);
      setLoginPw("");
    }
  }

  async function hostStart() {
    try {
      const code = makeSessionCode();
      await hostStartSession(code, stateRef.current, (cmd) => dispatch(cmd as GameAction), setOnline);
      setHostCode(code);
      setHostActive(true);
      setToast(`📡 Sesi ${code} dibuat. Masukkan kode ini di ponsel guru.`);
    } catch (e) {
      setToast(`⚠ Gagal membuat sesi: ${e instanceof Error ? e.message : "periksa konfigurasi Firebase & koneksi internet."}`);
    }
  }

  async function hostStop() {
    if (hostCode) await hostEndSession(hostCode);
    await disconnectFirebase();
    setHostActive(false);
    setHostCode(null);
    setOnline(false);
  }

  function doReset() {
    void hostStop();
    dispatch({ type: "RESET" });
    setConfirm(null);
    setPanelOpen(false);
    setScreen("setup");
    audio.playMusic("intro");
  }

  const remoteDispatch = (a: GameAction) => dispatch(a);

  return (
    <div className="bg-stage grain relative min-h-screen">
      <Cosmos />

      {screen === "landing" && (
        <Landing
          onStart={() => requireTeacher("teacher")}
          onTeacher={() => requireTeacher("teacher")}
          onHelp={() => setHelpOpen(true)}
          onRemote={() => setRemoteOpen(true)}
        />
      )}

      {screen === "setup" && unlocked && (
        <Setup
          bank={bank}
          onBankChange={setBank}
          onStart={handleStart}
          onBack={() => setScreen("landing")}
          initialPassword={password}
        />
      )}

      {screen === "game" && (
        <>
          <GameBoard
            s={state} view={view} unlocked={unlocked} muted={muted}
            sessionCode={hostCode} online={online}
            onPick={(i) => { audio.pick(); dispatch({ type: "PICK_BOX", index: i }); }}
            onMute={() => audioCtl.setMuted(!muted)}
            onToggleView={() => setView(view === "guru" ? "proyektor" : "guru")}
            onLock={() => { setLogin("view"); setLoginErr(false); setLoginPw(""); }}
            onLockTeacher={lockTeacher}
            onHelp={() => setHelpOpen(true)}
            onTeacher={() => { if (unlocked) setPanelOpen(true); else { setLogin("panel"); setLoginErr(false); setLoginPw(""); } }}
          />
          <QuestionStage s={state} dispatch={remoteDispatch} view={view} />
          {state.paused && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950/92 backdrop-blur-sm">
              <p className="font-display gold-text pop-in text-5xl sm:text-7xl">⏸ JEDA</p>
              <p className="mt-3 text-base font-bold text-white/70">Permainan dijeda oleh guru</p>
              {unlocked ? (
                <button onClick={() => dispatch({ type: "GAME_RESUME" })} className="btn-gold mt-6 rounded-2xl px-8 py-3.5 text-xl">▶ LANJUTKAN</button>
              ) : (
                <p className="mt-6 text-sm font-bold text-white/50">Menunggu guru melanjutkan…</p>
              )}
            </div>
          )}
        </>
      )}

      {screen === "results" && <Results s={state} onNewGame={() => requireTeacher("newgame")} />}

      {screen !== "game" && (
        <button
          onClick={() => { audio.ensure(); audioCtl.setMuted(!muted); }}
          className="btn-navy fixed right-3 top-3 z-40 rounded-full px-3.5 py-2 text-base"
          title={muted ? "Nyalakan semua audio" : "Matikan semua audio"}
          aria-label="Kontrol audio"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}

      {panelOpen && unlocked && screen === "game" && (
        <TeacherPanel
          s={state} dispatch={remoteDispatch}
          view={view} setView={setView}
          audioCtl={audioCtl}
          password={password} onChangePassword={(pw) => { setPassword(pw); setToast("🔑 Password guru berhasil diganti."); }}
          host={{ active: hostActive, code: hostCode, online }}
          onHostStart={() => void hostStart()}
          onHostStop={() => void hostStop()}
          onEndGame={() => setConfirm("end")}
          onNewGame={() => setConfirm("new")}
          onLock={lockTeacher}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Remote open={remoteOpen} onClose={() => setRemoteOpen(false)} />

      {/* ===== Login guru ===== */}
      <Modal open={login !== null} onClose={() => { setLogin(null); setLoginPw(""); }} title="🔐 MASUK MODE GURU">
        <form onSubmit={(e) => { e.preventDefault(); submitLogin(); }}>
          <p className="mb-3 text-sm font-semibold text-white/70">Area guru dilindungi password: persiapan permainan, upload / download template, preview soal, dan seluruh kontrol. Siswa cukup menonton layar permainan.</p>
          <input
            type="password" value={loginPw} autoFocus
            onChange={(e) => { setLoginPw(e.target.value); setLoginErr(false); }}
            placeholder="Password guru" autoComplete="current-password"
            className={`w-full rounded-xl border bg-navy-950 px-4 py-3 text-lg font-bold outline-none transition ${loginErr ? "border-danger" : "border-gold-500/40 focus:border-gold-400"}`}
          />
          {loginErr && <p className="mt-2 text-sm font-bold text-danger">⚠ Password salah. Coba lagi.</p>}
          <button type="submit" className="btn-gold mt-4 w-full rounded-xl py-3 text-lg">MASUK</button>
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">Password sisi klien hanya pembatas akses antarmuka, bukan keamanan kuat. Jangan menampilkan password di layar proyektor.</p>
        </form>
      </Modal>

      {/* ===== Konfirmasi ===== */}
      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "end" ? "🏁 AKHIRI PERMAINAN?" : "🔄 PERMAINAN BARU?"}>
        {confirm === "end" ? (
          <>
            <p className="text-sm font-semibold leading-relaxed text-white/80">
              Akhiri permainan sekarang dan tampilkan hasil akhir? Kotak yang belum dibuka tidak akan dimainkan.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn-navy rounded-xl py-3 text-sm" onClick={() => setConfirm(null)}>BATAL</button>
              <button className="btn-danger rounded-xl py-3 text-sm" onClick={() => { setConfirm(null); dispatch({ type: "END_GAME" }); }}>YA, AKHIRI</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold leading-relaxed text-white/80">
              Apakah Anda yakin ingin mengakhiri sesi ini dan memulai permainan baru? Data sesi saat ini akan dihapus dari aplikasi jika belum diekspor.
            </p>
            <p className="mt-2 text-xs font-bold text-white/50">File Excel sumber yang telah diunggah tetap tersimpan dan dapat dipakai lagi.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn-navy rounded-xl py-3 text-sm" onClick={() => setConfirm(null)}>BATAL</button>
              <button className="btn-gold rounded-xl py-3 text-sm" onClick={doReset}>YA, PERMAINAN BARU</button>
            </div>
          </>
        )}
      </Modal>

      {/* ===== Toast ===== */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-[95] w-[92%] max-w-md -translate-x-1/2">
          <div className="panel pop-in rounded-xl px-4 py-3 text-center text-sm font-bold text-gold-200">{toast}</div>
        </div>
      )}
    </div>
  );
}
