import { MysteryBoxVisual, Sparkles } from "./ui";
import { audio } from "../lib/audio";

export default function Landing({ onStart, onTeacher, onHelp, onRemote }: {
  onStart: () => void; onTeacher: () => void; onHelp: () => void; onRemote: () => void;
}) {
  const go = (fn: () => void) => () => {
    audio.ensure();
    audio.click();
    audio.playMusic("intro");
    fn();
  };
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="marquee-lights absolute left-0 right-0 top-0 h-[3px]" />
      <div className="marquee-lights absolute bottom-0 left-0 right-0 h-[3px]" />

      <div className="rise-in mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-navy-850/60 px-4 py-1.5 text-[11px] font-semibold tracking-[0.28em] text-gold-300 backdrop-blur-md sm:text-xs">
          <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-limex/70" /><span className="h-2 w-2 rounded-full bg-limex" /></span>
          GAME SHOW EDUKASI • KELAS 6 SD
        </span>
        <span className="rounded-full border border-cyanx/30 bg-cyanx/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.28em] text-cyanx backdrop-blur-md sm:text-xs">
          🪐 EDISI TATA SURYA
        </span>
      </div>

      <h1 className="gold-text font-display text-center font-bold leading-[0.95] tracking-tight" style={{ fontSize: "clamp(3.2rem, 11vw, 7.8rem)" }}>
        MYSTERY BOX
      </h1>
      <p className="rise-in mt-4 text-center text-lg font-light tracking-wide text-white/85 sm:text-2xl" style={{ animationDelay: "0.15s" }}>
        “Buka Kotaknya, <span className="font-semibold text-gold-300">Pecahkan Misterinya!</span>”
      </p>

      {/* ===== Hero: kotak emas di tengah orbit planet ===== */}
      <div className="relative my-10 grid h-64 w-64 place-items-center sm:my-12 sm:h-80 sm:w-80">
        <div className="hero-glow" />
        <div className="orbit orbit-a"><span className="orb-planet planet-cyan" /></div>
        <div className="orbit orbit-b"><span className="orb-planet planet-magenta" /></div>
        <div className="orbit orbit-c"><span className="orb-planet planet-gold" /><span className="orb-planet planet-violet" style={{ top: "100%" }} /></div>
        <div className="floaty mbox-wrap relative z-10 w-36 sm:w-44">
          <MysteryBoxVisual number="?" value={100} />
        </div>
        <Sparkles count={12} />
      </div>

      <div className="flex w-full max-w-md flex-col items-stretch gap-3.5">
        <button onClick={go(onStart)} className="btn-gold rounded-2xl px-8 py-4 text-xl tracking-wider sm:text-2xl">
          ▶&ensp;MULAI PERMAINAN
        </button>
        <div className="grid grid-cols-2 gap-3.5">
          <button onClick={go(onTeacher)} className="btn-navy rounded-2xl px-4 py-3.5 text-sm sm:text-base">🔐 MODE GURU</button>
          <button onClick={go(onHelp)} className="btn-navy rounded-2xl px-4 py-3.5 text-sm sm:text-base">📖 PETUNJUK</button>
        </div>
        <button onClick={go(onRemote)} className="mx-auto mt-1 rounded-full border border-cyanx/35 bg-navy-850/60 px-5 py-2 text-xs font-semibold text-cyanx backdrop-blur-md transition hover:border-cyanx/70 hover:bg-cyanx/10 sm:text-sm">
          📱 Hubungkan Remote Guru (2 Perangkat)
        </button>
      </div>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-white/60 sm:text-xs">
        <span className="rounded-full border border-white/10 bg-navy-850/60 px-3.5 py-1.5 backdrop-blur-md">🎁 30 Kotak Misteri</span>
        <span className="rounded-full border border-white/10 bg-navy-850/60 px-3.5 py-1.5 backdrop-blur-md">⚡ Kejutan Acak</span>
        <span className="rounded-full border border-white/10 bg-navy-850/60 px-3.5 py-1.5 backdrop-blur-md">⏱ 60 Detik / Soal</span>
        <span className="rounded-full border border-white/10 bg-navy-850/60 px-3.5 py-1.5 backdrop-blur-md">🏆 Papan Skor Langsung</span>
      </div>

      <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-gold-400/85">created by wiyanto abu hanif</p>
      <p className="mt-1.5 text-[10px] text-white/35">🔊 Musik aktif setelah tombol pertama ditekan (kebijakan browser)</p>
    </div>
  );
}
