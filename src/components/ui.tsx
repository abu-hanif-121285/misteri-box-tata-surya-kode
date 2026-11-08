import { useMemo, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { GROUP_COLORS, type Group } from "../types";

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-md" onClick={onClose} />
      <div className={cn("panel relative z-10 w-full rounded-3xl p-5 sm:p-6 pop-in max-h-[92vh] flex flex-col", wide ? "max-w-4xl" : "max-w-lg")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold tracking-wide text-gold-400 sm:text-xl">{title}</h3>
          <button onClick={onClose} className="btn-navy rounded-xl px-3 py-1 text-sm" aria-label="Tutup">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button className="btn-navy h-11 w-11 rounded-xl text-xl" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Kurangi">−</button>
      <span className="font-display w-12 text-center text-2xl font-bold text-gold-300">{value}</span>
      <button className="btn-navy h-11 w-11 rounded-xl text-xl" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Tambah">+</button>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 py-1 text-left">
      <span className="text-sm font-semibold text-white/90">{label}</span>
      <span className={cn("relative h-7 shrink-0 rounded-full border transition-colors", checked ? "border-gold-400 bg-gold-500/80" : "border-white/25 bg-navy-700")} style={{ width: 52 }}>
        <span className="absolute rounded-full bg-white shadow transition-all" style={{ width: 22, height: 22, left: checked ? 26 : 3, top: 2 }} />
      </span>
    </button>
  );
}

export function TimerRing({ timeLeft, total, size = 150 }: { timeLeft: number; total: number; size?: number }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  const R = 45;
  const C = 2 * Math.PI * R;
  const color = ratio > 0.5 ? "#ffc84a" : ratio > 0.25 ? "#ffb020" : "#ff5470";
  const secs = Math.ceil(timeLeft);
  return (
    <div className={cn("relative", secs <= 10 && secs > 0 && "timer-critical")} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="rgba(7,11,38,0.72)" stroke="rgba(255,255,255,0.09)" strokeWidth="5.5" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.4s", filter: `drop-shadow(0 0 7px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold leading-none" style={{ color, fontSize: size * 0.3 }}>{secs}</span>
        <span className="text-[10px] font-semibold tracking-[0.25em] text-white/55">DETIK</span>
      </div>
    </div>
  );
}

export function GroupChip({ group, active, big }: { group: Group; active?: boolean; big?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border font-display font-bold tracking-wide", big ? "px-5 py-2 text-lg sm:text-xl" : "px-3 py-1 text-xs sm:text-sm", active && "turn-glow")}
      style={{ borderColor: group.color, color: group.color, background: "rgba(7,11,38,0.75)", backdropFilter: "blur(6px)", "--gc": group.color } as CSSProperties}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: group.color, boxShadow: `0 0 8px ${group.color}` }} />
      {group.name}
    </span>
  );
}

export function Confetti({ count = 90 }: { count?: number }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    dur: 3 + Math.random() * 3,
    color: GROUP_COLORS[i % GROUP_COLORS.length],
    rot: (Math.random() * 720 - 360).toFixed(0) + "deg",
    dx: (Math.random() * 160 - 80).toFixed(0) + "px",
    w: 7 + Math.random() * 8,
  })), [count]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{
          left: `${p.left}%`, background: p.color, width: p.w, height: p.w * 1.5,
          animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, borderRadius: i % 3 === 0 ? "50%" : 2,
          "--rot": p.rot, "--dx": p.dx,
        } as CSSProperties} />
      ))}
    </div>
  );
}

export function Sparkles({ count = 22 }: { count?: number }) {
  const sparks = useMemo(() => Array.from({ length: count }, () => {
    const ang = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 220;
    return {
      dx: `${Math.cos(ang) * dist}px`, dy: `${Math.sin(ang) * dist}px`,
      rot: `${Math.random() * 540}deg`, delay: `${Math.random() * 0.25}s`,
      size: 5 + Math.random() * 9,
    };
  }), [count]);
  return (
    <div className="pointer-events-none absolute inset-0">
      {sparks.map((s, i) => (
        <span key={i} className="spark" style={{ width: s.size, height: s.size, animationDelay: s.delay, "--dx": s.dx, "--dy": s.dy, "--rot": s.rot } as CSSProperties} />
      ))}
    </div>
  );
}

export function Twinkles({ count = 40 }: { count?: number }) {
  const stars = useMemo(() => Array.from({ length: count }, () => ({
    left: Math.random() * 100, top: Math.random() * 100,
    size: 1.5 + Math.random() * 2.6, dur: 2 + Math.random() * 4, delay: Math.random() * 4,
  })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <span key={i} className="twinkle" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}

/** Latar kosmik berlapis: nebula, aurora, bintang, orbit, bintang jatuh, Saturnus. */
export function Cosmos() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="nebula nebula-a" />
      <div className="nebula nebula-b" />
      <div className="nebula nebula-c" />
      <div className="aurora-band" />
      <Twinkles count={60} />
      <span className="shoot shoot-a" />
      <span className="shoot shoot-b" />
      <div className="cosmos-ring cosmos-ring-a" />
      <div className="cosmos-ring cosmos-ring-b" />
      <svg viewBox="0 0 200 140" className="absolute right-[-40px] top-[6%] w-56 opacity-[0.14] sm:w-80" aria-hidden>
        <defs>
          <radialGradient id="cosSat" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#fff3cf" />
            <stop offset="45%" stopColor="#ffc84a" />
            <stop offset="100%" stopColor="#6b4400" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="70" r="38" fill="url(#cosSat)" />
        <ellipse cx="100" cy="70" rx="78" ry="18" fill="none" stroke="#ffe08a" strokeWidth="4" transform="rotate(-18 100 70)" opacity="0.8" />
        <ellipse cx="100" cy="70" rx="92" ry="23" fill="none" stroke="#4ce0ff" strokeWidth="1.5" transform="rotate(-18 100 70)" opacity="0.5" />
      </svg>
    </div>
  );
}

/** Kotak misteri 3D (CSS) — dipakai di landing, papan, dan sinematik. */
export function MysteryBoxVisual({ number, value, opened, picked, lidOpen, dim }: {
  number?: number | string; value?: number; opened?: boolean; picked?: boolean; lidOpen?: boolean; dim?: boolean;
}) {
  return (
    <div className={cn("mbox", opened && "opened", picked && "picked", dim && "opacity-80")}>
      <div className="mbox-glow" />
      <div className={cn("mbox-face", lidOpen && "bigbox-body-open")}>
        <div className="mbox-ribbon" />
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center">
          {opened && !picked ? (
            <span className="font-display text-xl font-bold text-gold-400/60 sm:text-2xl">✓</span>
          ) : (
            <>
              <span className="font-display font-bold leading-none text-navy-900" style={{ fontSize: "clamp(1.1rem, 3.2vw, 2rem)", textShadow: "0 1px 0 rgba(255,255,255,0.45)" }}>{number}</span>
              <span className="mt-1 rounded-full bg-navy-950/85 px-2 py-px text-[0.55rem] font-bold tracking-wider text-gold-300 sm:text-[0.65rem]">{value} POIN</span>
            </>
          )}
        </div>
      </div>
      <div className={cn("mbox-lid", lidOpen && "bigbox-lid-open")}>
        <div className="absolute left-1/2 top-1/2 h-[130%] w-[15%] -translate-x-1/2 -translate-y-1/2 rounded bg-navy-900/20" />
      </div>
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const meta: Record<string, { label: string; color: string }> = {
    PG: { label: "PILIHAN GANDA", color: "#4ce0ff" },
    BENAR_SALAH: { label: "BENAR / SALAH", color: "#46f0a0" },
    ISIAN: { label: "ISIAN SINGKAT", color: "#ff9448" },
    URAIAN: { label: "URAIAN", color: "#a78bff" },
  };
  const m = meta[type] ?? { label: type, color: "#ffc84a" };
  return (
    <span className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] sm:text-xs" style={{ borderColor: m.color + "88", color: m.color, background: "rgba(7,11,38,0.65)", backdropFilter: "blur(6px)" }}>
      {m.label}
    </span>
  );
}
