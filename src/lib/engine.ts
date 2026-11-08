import type {
  GameState, GameAction, Group, MysteryBox, Question, HistoryEntry, GameSettings,
} from "../types";
import { randomChallenge } from "../data/challenges";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Acak nilai (10..100), urutan soal, dan kejutan eksklusif (masing-masing 3–5 kotak). */
export function generateBoxes(questions: Question[]): MysteryBox[] {
  const order = shuffle(questions.map((_, i) => i));
  const boxes: MysteryBox[] = order.map((qIndex, i) => ({
    id: i + 1,
    value: (1 + Math.floor(Math.random() * 10)) * 10,
    surprise: null,
    qIndex,
    opened: false,
  }));
  const nBonus = 3 + Math.floor(Math.random() * 3);
  const nDouble = 3 + Math.floor(Math.random() * 3);
  const nChallenge = 3 + Math.floor(Math.random() * 3);
  const slots = shuffle(boxes.map((_, i) => i));
  let p = 0;
  for (let i = 0; i < nBonus; i++) boxes[slots[p++]].surprise = "BONUS";
  for (let i = 0; i < nDouble; i++) boxes[slots[p++]].surprise = "DOUBLE";
  for (let i = 0; i < nChallenge; i++) boxes[slots[p++]].surprise = "CHALLENGE";
  return boxes;
}

export const DEFAULT_SETTINGS: GameSettings = {
  answerTime: 60,
  challengeTime: 30,
  revealExplanation: "teacher",
};

export function initialState(): GameState {
  return {
    phase: "pick",
    boxes: [],
    groups: [],
    questions: [],
    settings: { ...DEFAULT_SETTINGS },
    turn: 0,
    currentBox: null,
    attempt: 1,
    answerer: null,
    firstAnswerer: null,
    firstWrong: false,
    chosenLog: "",
    timeLeft: 0,
    timerTotal: 60,
    timerRunning: false,
    paused: false,
    challenge: null,
    pending: null,
    lastResult: null,
    history: [],
    adjustments: [],
    startedAt: null,
    endedAt: null,
    openedCount: 0,
  };
}

export function currentQuestion(s: GameState): Question | null {
  if (s.currentBox === null || !s.boxes[s.currentBox]) return null;
  return s.questions[s.boxes[s.currentBox].qIndex] ?? null;
}

export function checkAuto(q: Question, chosen: string): boolean {
  return q.key.trim().toUpperCase() === chosen.trim().toUpperCase();
}

function clone(s: GameState): GameState {
  return {
    ...s,
    boxes: s.boxes.map((b) => ({ ...b })),
    groups: s.groups.map((g) => ({ ...g })),
    history: [...s.history],
    adjustments: [...s.adjustments],
    pending: s.pending ? { ...s.pending } : null,
    lastResult: s.lastResult ? { ...s.lastResult } : null,
    settings: { ...s.settings },
  };
}

/** Satu-satunya tempat perubahan poin soal — menjamin tidak ada poin ganda. */
function resolveAttempt(d: GameState, correct: boolean, chosen: string) {
  const box = d.boxes[d.currentBox!];
  const gid = d.answerer!;
  const group = d.groups.find((g) => g.id === gid)!;
  d.chosenLog = d.chosenLog ? `${d.chosenLog} → ${chosen}` : chosen;

  if (correct) {
    const base = box.value;
    const doublePts = box.surprise === "DOUBLE" ? base : 0;
    const bonusPts = box.surprise === "BONUS" ? 50 : 0;
    group.points += base + doublePts + bonusPts;
    group.correct += 1;
    if (bonusPts > 0) group.bonusCount += 1;
    if (doublePts > 0) group.doubleCount += 1;
    d.pending = {
      ...d.pending!,
      answererId: gid,
      status: "BENAR",
      basePts: base,
      bonusPts,
      doublePts,
      challengePts: 0,
      totalPts: base + doublePts + bonusPts,
      chosen: d.chosenLog,
    };
    if (box.surprise === "CHALLENGE") {
      d.phase = "challenge";
      d.challenge = randomChallenge();
      d.timeLeft = d.settings.challengeTime;
      d.timerTotal = d.settings.challengeTime;
      d.timerRunning = true;
    } else {
      finalizeRound(d, "BENAR");
    }
    return;
  }

  group.wrong += 1;
  if (d.attempt === 1) {
    const others = d.groups.filter((g) => g.id !== gid);
    const target = others[Math.floor(Math.random() * others.length)];
    d.firstWrong = true;
    d.attempt = 2;
    d.answerer = target.id;
    d.phase = "throw";
    d.timerRunning = false;
  } else {
    d.pending = { ...d.pending!, chosen: d.chosenLog };
    finalizeRound(d, "GUGUR");
  }
}

function gradeChallenge(d: GameState, success: boolean) {
  if (success) {
    const group = d.groups.find((g) => g.id === d.pending!.answererId)!;
    group.points += 50;
    group.challengeCount += 1;
    d.pending = { ...d.pending!, challengePts: 50, totalPts: d.pending!.totalPts + 50 };
  }
  finalizeRound(d, "BENAR");
}

function finalizeRound(d: GameState, status: HistoryEntry["status"]) {
  const p: HistoryEntry = { ...d.pending!, status };
  d.history.push(p);
  d.lastResult = {
    status,
    winnerId: status === "BENAR" ? p.answererId : null,
    lastAnswererId: d.answerer ?? p.pickerId,
    thrown: d.firstWrong,
    basePts: status === "BENAR" ? p.basePts : 0,
    bonusPts: p.bonusPts,
    doublePts: p.doublePts,
    challengePts: p.challengePts,
    totalPts: status === "BENAR" ? p.totalPts : 0,
    surprise: p.surprise,
    chosen: p.chosen,
  };
  d.pending = null;
  d.phase = "result";
  d.timerRunning = false;
  d.challenge = null;
}

function handleTimeout(d: GameState) {
  if (d.phase === "question") resolveAttempt(d, false, "⏱ Waktu habis");
  else if (d.phase === "challenge") gradeChallenge(d, false);
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case "START_GAME": {
      const n = initialState();
      n.groups = a.groups.map((g) => ({ ...g, points: 0, correct: 0, wrong: 0, bonusCount: 0, doubleCount: 0, challengeCount: 0 }));
      n.questions = a.questions;
      n.settings = { ...a.settings };
      n.boxes = generateBoxes(a.questions);
      n.startedAt = Date.now();
      n.phase = "pick";
      return n;
    }
    case "PICK_BOX": {
      if (s.phase !== "pick" || s.paused) return s;
      const box = s.boxes[a.index];
      if (!box || box.opened) return s;
      const d = clone(s);
      d.boxes[a.index].opened = true;
      d.openedCount += 1;
      d.currentBox = a.index;
      d.phase = "opening";
      d.attempt = 1;
      d.firstWrong = false;
      d.chosenLog = "";
      const picker = d.groups[d.turn];
      d.answerer = picker.id;
      d.firstAnswerer = picker.id;
      d.pending = {
        boxNo: box.id,
        questionNo: d.questions[box.qIndex].no,
        questionText: d.questions[box.qIndex].text,
        type: d.questions[box.qIndex].type,
        pickerId: picker.id,
        firstWrong: false,
        answererId: null,
        value: box.value,
        surprise: box.surprise,
        status: "GUGUR",
        basePts: 0, bonusPts: 0, doublePts: 0, challengePts: 0, totalPts: 0,
        chosen: "",
      };
      return d;
    }
    case "OPEN_DONE": {
      if (s.phase !== "opening") return s;
      const d = clone(s);
      d.phase = "question";
      d.timeLeft = d.settings.answerTime;
      d.timerTotal = d.settings.answerTime;
      d.timerRunning = true;
      return d;
    }
    case "RESOLVE": {
      if (s.phase !== "question" || s.paused) return s;
      const d = clone(s);
      d.pending = { ...d.pending!, firstWrong: d.firstWrong };
      resolveAttempt(d, a.correct, a.chosen);
      return d;
    }
    case "THROW_DONE": {
      if (s.phase !== "throw") return s;
      const d = clone(s);
      d.phase = "question";
      d.timeLeft = d.settings.answerTime;
      d.timerTotal = d.settings.answerTime;
      d.timerRunning = true;
      return d;
    }
    case "CHALLENGE_GRADE": {
      if (s.phase !== "challenge") return s;
      const d = clone(s);
      gradeChallenge(d, a.success);
      return d;
    }
    case "NEXT": {
      if (s.phase !== "result") return s;
      const d = clone(s);
      d.currentBox = null;
      d.lastResult = null;
      d.attempt = 1;
      d.answerer = null;
      d.firstAnswerer = null;
      d.firstWrong = false;
      d.chosenLog = "";
      if (d.openedCount >= d.boxes.length) {
        d.phase = "finished";
        d.endedAt = Date.now();
      } else {
        d.turn = (d.turn + 1) % d.groups.length;
        d.phase = "pick";
      }
      return d;
    }
    case "SKIP": {
      if (s.phase === "question" || s.phase === "throw") {
        const d = clone(s);
        d.pending = { ...d.pending!, chosen: "Dilewati guru" };
        finalizeRound(d, "DILEWATI");
        return d;
      }
      if (s.phase === "challenge") {
        const d = clone(s);
        gradeChallenge(d, false);
        return d;
      }
      return s;
    }
    case "CANCEL": {
      if (s.phase !== "question" && s.phase !== "throw" && s.phase !== "opening") return s;
      const d = clone(s);
      if (d.firstWrong && d.firstAnswerer !== null) {
        const g = d.groups.find((x) => x.id === d.firstAnswerer);
        if (g && g.wrong > 0) g.wrong -= 1;
      }
      if (d.currentBox !== null) d.boxes[d.currentBox].opened = false;
      d.openedCount -= 1;
      d.currentBox = null;
      d.pending = null;
      d.phase = "pick";
      d.timerRunning = false;
      d.attempt = 1;
      d.answerer = null;
      d.firstAnswerer = null;
      d.firstWrong = false;
      d.chosenLog = "";
      return d;
    }
    case "TICK": {
      if (!s.timerRunning || s.paused) return s;
      if (s.phase !== "question" && s.phase !== "challenge") return s;
      const d = clone(s);
      d.timeLeft = Math.max(0, d.timeLeft - a.dt);
      if (d.timeLeft <= 0) handleTimeout(d);
      return d;
    }
    case "TIMER_SET": {
      if (s.phase !== "question" && s.phase !== "challenge") return s;
      const d = clone(s);
      d.timeLeft = Math.max(1, Math.min(600, a.seconds));
      d.timerTotal = d.timeLeft;
      return d;
    }
    case "TIMER_ADD": {
      if (s.phase !== "question" && s.phase !== "challenge") return s;
      const d = clone(s);
      d.timeLeft = Math.max(0, Math.min(600, d.timeLeft + a.seconds));
      if (d.timeLeft <= 0) handleTimeout(d);
      return d;
    }
    case "TIMER_PAUSE": {
      if (!s.timerRunning) return s;
      return { ...s, timerRunning: false };
    }
    case "TIMER_RESUME": {
      if ((s.phase !== "question" && s.phase !== "challenge") || s.timerRunning || s.timeLeft <= 0) return s;
      return { ...s, timerRunning: true };
    }
    case "TIMER_RESET": {
      if (s.phase !== "question" && s.phase !== "challenge") return s;
      return { ...s, timeLeft: s.timerTotal, timerRunning: true };
    }
    case "TIMER_STOP": {
      if (s.phase !== "question" && s.phase !== "challenge") return s;
      const d = clone(s);
      d.timeLeft = 0;
      handleTimeout(d);
      return d;
    }
    case "GAME_PAUSE":
      return { ...s, paused: true };
    case "GAME_RESUME":
      return { ...s, paused: false };
    case "ADJUST_SCORE": {
      const d = clone(s);
      const g = d.groups.find((x) => x.id === a.groupId);
      if (!g || a.delta === 0) return s;
      g.points = Math.max(0, g.points + a.delta);
      d.adjustments.push({ groupId: a.groupId, delta: a.delta, at: Date.now() });
      return d;
    }
    case "SET_REVEAL": {
      const d = clone(s);
      d.settings.revealExplanation = a.value;
      return d;
    }
    case "END_GAME": {
      if (s.phase === "finished") return s;
      const d = clone(s);
      d.phase = "finished";
      d.endedAt = Date.now();
      d.timerRunning = false;
      return d;
    }
    case "RESET":
      return initialState();
    default:
      return s;
  }
}

export interface RankedGroup extends Group { rank: number }

/** Peringkat kompetisi: poin sama = peringkat sama (1, 2, 2, 4). */
export function rankGroups(groups: Group[]): RankedGroup[] {
  const sorted = [...groups].sort((x, y) => y.points - x.points || x.id - y.id);
  let lastPts = Number.NaN;
  let lastRank = 0;
  return sorted.map((g, i) => {
    const rank = g.points === lastPts ? lastRank : i + 1;
    lastPts = g.points;
    lastRank = rank;
    return { ...g, rank };
  });
}
