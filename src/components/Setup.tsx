import { useRef, useState, type CSSProperties } from "react";
import type { GameSettings, Group, Question } from "../types";
import { GROUP_COLORS } from "../types";
import { DEFAULT_QUESTIONS, DEFAULT_BANK_NAME } from "../data/questions";
import { downloadTemplate, parseQuestionFile } from "../lib/excel";
import { DEFAULT_SETTINGS } from "../lib/engine";
import { Modal, Stepper, TypeBadge } from "./ui";
import { audio } from "../lib/audio";

const AVATARS = ["🪐", "🚀", "🌙", "⭐", "☄️", "🌍", "", "🌟", "🔭", "🧑🚀"];

export interface BankInfo { questions: Question[]; name: string }

export default function Setup({ bank, onBankChange, onStart, onBack, initialPassword }: {
  bank: BankInfo;
  onBankChange: (b: BankInfo) => void;
  onStart: (groups: Group[], settings: GameSettings, password: string) => void;
  onBack: () => void;
  initialPassword: string;
}) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(Array.from({ length: 10 }, (_, i) => `Kelompok ${i + 1}`));
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS });
  const [password, setPassword] = useState(initialPassword);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploadOk, setUploadOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bankValid = bank.questions.length === 30;
  const namesValid = names.slice(0, count).every((n) => n.trim().length > 0);
  const pwValid = password.trim().length >= 4;
  const canStart = bankValid && namesValid && pwValid;

  const dist = bank.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setUploadOk("");
    try {
      const res = await parseQuestionFile(f);
      const fatal = res.errors.filter((e) => !e.startsWith('Sheet "BANK SOAL"'));
      if (res.questions.length === 30 && fatal.length === 0) {
        onBankChange({ questions: res.questions, name: res.fileName });
        setErrors(res.errors);
        setUploadOk(`✅ ${res.fileName} valid — 30 soal siap dimainkan!`);
        audio.correct();
      } else {
        setErrors(res.errors.length ? res.errors : ["Validasi gagal: soal tidak lengkap."]);
        audio.wrong();
      }
    } catch {
      setErrors(["Terjadi kesalahan saat membaca file. Coba lagi."]);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function start() {
    if (!canStart) return;
    audio.click();
    const groups: Group[] = names.slice(0, count).map((n, i) => ({
      id: i + 1, name: n.trim(), color: GROUP_COLORS[i % GROUP_COLORS.length],
      points: 0, correct: 0, wrong: 0, bonusCount: 0, doubleCount: 0, challengeCount: 0,
    }));
    onStart(groups, settings, password.trim());
  }

  const inputCls = "w-full rounded-xl border border-gold-500/30 bg-navy-900/80 px-3 py-2.5 font-bold text-white outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30";

  return (
    <div className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="btn-navy rounded-xl px-4 py-2 text-sm">← KEMBALI</button>
        <h1 className="font-display gold-text text-2xl sm:text-4xl">PERSIAPAN PERMAINAN</h1>
        <span className="mr-12 rounded-full bg-navy-800 px-3 py-1 text-xs font-bold text-cyanx">🧑 Area Guru</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ===== Kelompok ===== */}
        <section className="panel rounded-2xl p-5">
          <h2 className="font-display mb-3 text-lg text-gold-400">👥 KELOMPOK</h2>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-navy-900/60 p-3">
            <span className="font-bold text-white/85">Jumlah kelompok <span className="text-white/45">(min. 2)</span></span>
            <Stepper value={count} onChange={setCount} min={2} max={10} />
          </div>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {names.slice(0, count).map((n, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border p-2" style={{ borderColor: GROUP_COLORS[i] + "55", background: "rgba(6,13,36,0.6)" }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl" style={{ background: GROUP_COLORS[i] + "22", border: `2px solid ${GROUP_COLORS[i]}` } as CSSProperties}>{AVATARS[i]}</span>
                <input
                  className="w-full bg-transparent font-bold text-white outline-none placeholder:text-white/30"
                  value={n}
                  maxLength={20}
                  placeholder={`Nama kelompok ${i + 1}`}
                  onChange={(e) => setNames((prev) => prev.map((x, xi) => (xi === i ? e.target.value : x)))}
                />
              </div>
            ))}
          </div>
          {!namesValid && <p className="mt-2 text-sm font-bold text-danger">⚠ Nama kelompok tidak boleh kosong.</p>}
        </section>

        {/* ===== Pengaturan ===== */}
        <section className="panel rounded-2xl p-5">
          <h2 className="font-display mb-3 text-lg text-gold-400">⚙️ PENGATURAN</h2>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-900/60 p-3">
              <div><p className="font-bold">Durasi menjawab</p><p className="text-xs text-white/50">per kesempatan (standar 60 detik)</p></div>
              <div className="flex items-center gap-2">
                <input type="number" min={10} max={300} value={settings.answerTime}
                  onChange={(e) => setSettings((s) => ({ ...s, answerTime: Math.max(10, Math.min(300, Number(e.target.value) || 60)) }))}
                  className="w-20 rounded-lg border border-gold-500/30 bg-navy-800 px-2 py-1.5 text-center font-display text-gold-300 outline-none" />
                <span className="text-sm font-bold text-white/60">dtk</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-900/60 p-3">
              <div><p className="font-bold">Durasi tantangan khusus</p><p className="text-xs text-white/50">standar 30 detik</p></div>
              <div className="flex items-center gap-2">
                <input type="number" min={10} max={180} value={settings.challengeTime}
                  onChange={(e) => setSettings((s) => ({ ...s, challengeTime: Math.max(10, Math.min(180, Number(e.target.value) || 30)) }))}
                  className="w-20 rounded-lg border border-gold-500/30 bg-navy-800 px-2 py-1.5 text-center font-display text-gold-300 outline-none" />
                <span className="text-sm font-bold text-white/60">dtk</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-900/60 p-3">
              <div><p className="font-bold">Tampilkan pembahasan</p><p className="text-xs text-white/50">setelah soal selesai dinilai</p></div>
              <select value={settings.revealExplanation}
                onChange={(e) => setSettings((s) => ({ ...s, revealExplanation: e.target.value as GameSettings["revealExplanation"] }))}
                className="rounded-lg border border-gold-500/30 bg-navy-800 px-2 py-2 font-bold text-gold-300 outline-none">
                <option value="always">Selalu (proyektor)</option>
                <option value="teacher">Hanya Mode Guru</option>
                <option value="never">Jangan tampilkan</option>
              </select>
            </div>
            <div className="rounded-xl border border-cyanx/25 bg-cyanx/5 p-3 text-xs font-semibold text-white/75">
              🎲 Otomatis & acak setiap permainan baru: <b className="text-cyanx">30 soal</b> • nilai kotak <b className="text-cyanx">10–100</b> (kelipatan 10) • urutan soal • posisi kejutan (Bonus / Double / Special Challenge).
            </div>
          </div>

          <h2 className="font-display mb-2 mt-5 text-lg text-gold-400">🔐 PASSWORD GURU</h2>
          <div className="flex gap-2">
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className={inputCls} placeholder="Minimal 4 karakter" autoComplete="new-password" />
            <button className="btn-navy rounded-xl px-3 text-lg" onClick={() => setShowPw((v) => !v)} aria-label="Lihat password">{showPw ? "🙈" : "👁"}</button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/50">
            Password ini melindungi Mode Guru &amp; Panel Guru. Dapat diganti di sini atau melalui Panel Guru → Keamanan. Jangan tampilkan password di layar proyektor.
            <span className="text-warn"> Catatan: password sisi klien hanya pembatas akses antarmuka, bukan keamanan kuat terhadap orang yang dapat membaca kode sumber. Autentikasi sesungguhnya membutuhkan backend.</span>
          </p>
        </section>

        {/* ===== Bank Soal ===== */}
        <section className="panel rounded-2xl p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg text-gold-400">📚 BANK SOAL (TEPAT 30)</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${bankValid ? "bg-limex/15 text-limex" : "bg-danger/15 text-danger"}`}>
              {bankValid ? `✅ ${bank.questions.length} SOAL VALID` : `✗ ${bank.questions.length}/30 SOAL`}
            </span>
          </div>

          <div className="mb-3 rounded-xl bg-navy-900/60 p-3">
            <p className="font-bold text-white/90">📄 {bank.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-bold text-white/60">
              {Object.entries(dist).map(([t, n]) => <span key={t} className="rounded-full bg-navy-800 px-2.5 py-0.5">{t.replace("_", " ")}: {n}</span>)}
            </div>
            {uploadOk && <p className="mt-2 text-sm font-bold text-limex">{uploadOk}</p>}
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <button onClick={() => { audio.click(); downloadTemplate(); }} className="btn-navy rounded-xl px-3 py-3 text-xs sm:text-sm">⬇ DOWNLOAD TEMPLATE</button>
            <button onClick={() => { audio.click(); fileRef.current?.click(); }} disabled={busy} className="btn-gold rounded-xl px-3 py-3 text-xs sm:text-sm">{busy ? "⏳ MEMBACA…" : "⬆ UPLOAD FILE EXCEL"}</button>
            <button onClick={() => { audio.click(); setPreview(true); }} className="btn-navy rounded-xl px-3 py-3 text-xs sm:text-sm">👁 PREVIEW SOAL</button>
            <button onClick={() => { audio.click(); fileRef.current?.click(); }} className="btn-navy rounded-xl px-3 py-3 text-xs sm:text-sm">🛠 PERBAIKI FILE</button>
          </div>
          {bank.name !== DEFAULT_BANK_NAME && (
            <button onClick={() => { onBankChange({ questions: DEFAULT_QUESTIONS, name: DEFAULT_BANK_NAME }); setErrors([]); setUploadOk(""); }}
              className="mt-2 text-xs font-bold text-cyanx underline-offset-2 hover:underline">↺ Gunakan kembali bank soal bawaan</button>
          )}

          {errors.length > 0 && (
            <div className="mt-3 max-h-44 overflow-y-auto rounded-xl border border-danger/40 bg-danger/10 p-3">
              <p className="mb-1 font-display text-sm text-danger">⚠ PERBAIKI FILE ANDA ({errors.length} catatan)</p>
              <ul className="list-inside list-disc space-y-0.5 text-xs font-semibold text-white/85">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              <p className="mt-2 text-[11px] text-white/55">Permainan tidak dapat dimulai sampai seluruh soal valid. Unduh template sebagai acuan format.</p>
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-3 z-20 mt-6">
        <button onClick={start} disabled={!canStart}
          className="btn-gold w-full rounded-2xl px-8 py-4 text-xl tracking-wider sm:text-2xl">
          🚀 MULAI PERMAINAN
        </button>
        {!canStart && (
          <p className="mt-1.5 text-center text-xs font-bold text-warn">
            {!bankValid ? "Unggah bank soal berisi tepat 30 soal yang valid." : !namesValid ? "Lengkapi nama kelompok." : "Password minimal 4 karakter."}
          </p>
        )}
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title={`PREVIEW — ${bank.name}`} wide>
        <div className="space-y-2">
          {bank.questions.map((q) => (
            <div key={q.no} className="rounded-xl border border-gold-500/15 bg-navy-900/60 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-display text-gold-400">#{q.no}</span>
                <TypeBadge type={q.type} />
                <span className="ml-auto rounded bg-navy-800 px-2 py-0.5 text-[11px] font-bold text-limex">Kunci: {q.key}</span>
              </div>
              <p className="text-sm font-bold text-white/95">{q.text}</p>
              {q.type === "PG" && (
                <div className="mt-1 grid gap-0.5 text-xs text-white/70 sm:grid-cols-2">
                  {q.options.map((o, i) => <span key={i} className={q.key === "ABCD"[i] ? "font-black text-limex" : ""}>{"ABCD"[i]}. {o}</span>)}
                </div>
              )}
              {q.explanation && <p className="mt-1 text-xs italic text-white/50">💡 {q.explanation}</p>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
