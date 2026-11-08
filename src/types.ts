export type QType = "PG" | "BENAR_SALAH" | "ISIAN" | "URAIAN";

export interface Question {
  no: number;
  type: QType;
  text: string;
  options: string[]; // 4 items for PG
  key: string; // A/B/C/D | BENAR/SALAH | teacher guide
  explanation: string;
}

export type Surprise = "BONUS" | "DOUBLE" | "CHALLENGE" | null;

export interface MysteryBox {
  id: number; // 1..30
  value: number; // 10..100
  surprise: Surprise;
  qIndex: number;
  opened: boolean;
}

export interface Group {
  id: number;
  name: string;
  color: string;
  points: number;
  correct: number;
  wrong: number;
  bonusCount: number;
  doubleCount: number;
  challengeCount: number;
}

export type RoundStatus = "BENAR" | "GUGUR" | "DILEWATI";

export interface HistoryEntry {
  boxNo: number;
  questionNo: number;
  questionText: string;
  type: QType;
  pickerId: number;
  firstWrong: boolean;
  answererId: number | null; // group that scored (null if none)
  value: number;
  surprise: Surprise;
  status: RoundStatus;
  basePts: number;
  bonusPts: number;
  doublePts: number;
  challengePts: number;
  totalPts: number;
  chosen: string;
}

export type ChallengeCategory =
  | "JAWAB CEPAT"
  | "TEBAK GAMBAR"
  | "TANTANGAN GERAK"
  | "TANTANGAN INGATAN"
  | "KERJA SAMA"
  | "TEKA-TEKI";

export interface Challenge {
  id: number;
  category: ChallengeCategory;
  text: string;
  emoji?: string;
  answer?: string;
  memoryWords?: string[];
}

export type Phase =
  | "pick"
  | "opening"
  | "question"
  | "throw"
  | "challenge"
  | "result"
  | "finished";

export interface RoundResult {
  status: RoundStatus;
  winnerId: number | null;
  lastAnswererId: number;
  thrown: boolean;
  basePts: number;
  bonusPts: number;
  doublePts: number;
  challengePts: number;
  totalPts: number;
  surprise: Surprise;
  chosen: string;
}

export interface GameSettings {
  answerTime: number; // default 60
  challengeTime: number; // default 30
  revealExplanation: "always" | "teacher" | "never";
}

export interface ScoreAdjustment {
  groupId: number;
  delta: number;
  at: number;
}

export interface GameState {
  phase: Phase;
  boxes: MysteryBox[];
  groups: Group[];
  questions: Question[];
  settings: GameSettings;
  turn: number; // index in groups
  currentBox: number | null; // index in boxes
  attempt: 1 | 2;
  answerer: number | null; // group id currently answering
  firstAnswerer: number | null;
  firstWrong: boolean;
  chosenLog: string;
  timeLeft: number;
  timerTotal: number;
  timerRunning: boolean;
  paused: boolean;
  challenge: Challenge | null;
  pending: HistoryEntry | null;
  lastResult: RoundResult | null;
  history: HistoryEntry[];
  adjustments: ScoreAdjustment[];
  startedAt: number | null;
  endedAt: number | null;
  openedCount: number;
}

export type ViewMode = "guru" | "proyektor";

export type GameAction =
  | { type: "START_GAME"; groups: Group[]; questions: Question[]; settings: GameSettings }
  | { type: "PICK_BOX"; index: number }
  | { type: "OPEN_DONE" }
  | { type: "RESOLVE"; correct: boolean; chosen: string }
  | { type: "THROW_DONE" }
  | { type: "CHALLENGE_GRADE"; success: boolean }
  | { type: "NEXT" }
  | { type: "SKIP" }
  | { type: "CANCEL" }
  | { type: "TICK"; dt: number }
  | { type: "TIMER_SET"; seconds: number }
  | { type: "TIMER_ADD"; seconds: number }
  | { type: "TIMER_PAUSE" }
  | { type: "TIMER_RESUME" }
  | { type: "TIMER_RESET" }
  | { type: "TIMER_STOP" }
  | { type: "GAME_PAUSE" }
  | { type: "GAME_RESUME" }
  | { type: "ADJUST_SCORE"; groupId: number; delta: number }
  | { type: "SET_REVEAL"; value: GameSettings["revealExplanation"] }
  | { type: "END_GAME" }
  | { type: "RESET" };

export const GROUP_COLORS = [
  "#ffc93c",
  "#35e0ff",
  "#ff5c9e",
  "#3ef08c",
  "#ff8a3d",
  "#b78cff",
  "#5b8cff",
  "#ff5252",
  "#7ef0e0",
  "#e8ff5c",
];

export const SURPRISE_META: Record<
  Exclude<Surprise, null>,
  { label: string; icon: string; color: string; desc: string }
> = {
  BONUS: { label: "BONUS POINT", icon: "🎁", color: "#3ef08c", desc: "Jawab benar dan raih +50 poin tambahan!" },
  DOUBLE: { label: "DOUBLE POINT", icon: "✖️", color: "#35e0ff", desc: "Jawab benar dan nilai kotak dikalikan DUA!" },
  CHALLENGE: { label: "SPECIAL CHALLENGE", icon: "⚡", color: "#ff5c9e", desc: "Jawab benar, lalu taklukkan tantangan +50 poin!" },
};