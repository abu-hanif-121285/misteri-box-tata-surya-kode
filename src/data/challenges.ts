import type { Challenge, ChallengeCategory } from "../types";

export const CHALLENGE_CATEGORY_META: Record<ChallengeCategory, { icon: string; color: string }> = {
  "JAWAB CEPAT": { icon: "⚡", color: "#ffc84a" },
  "TEBAK GAMBAR": { icon: "🔭", color: "#4ce0ff" },
  "TANTANGAN GERAK": { icon: "🤸", color: "#46f0a0" },
  "TANTANGAN INGATAN": { icon: "🧠", color: "#a78bff" },
  "KERJA SAMA": { icon: "🤝", color: "#ff9448" },
  "TEKA-TEKI": { icon: "🧩", color: "#ff5ca8" },
};

/** Bank tantangan bawaan bertema Tata Surya — aman di kelas, tanpa alat khusus, sesuai usia kelas 6 SD. */
export const CHALLENGES: Challenge[] = [
  { id: 1, category: "JAWAB CEPAT", text: "Sebutkan 5 nama planet dalam tata surya dalam 15 detik!", answer: "Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus (pilih 5)." },
  { id: 2, category: "JAWAB CEPAT", text: "Sebutkan urutan 4 planet terdekat dari Matahari dengan benar!", answer: "Merkurius, Venus, Bumi, Mars." },
  { id: 3, category: "JAWAB CEPAT", text: "Sebutkan 3 benda langit selain planet yang ada di tata surya!", answer: "Komet, asteroid, meteor, satelit, planet kerdil (pilih 3)." },
  { id: 4, category: "JAWAB CEPAT", text: "Sebutkan 4 fase Bulan yang kamu ketahui dalam 15 detik!", answer: "Bulan baru, sabit, separuh (kuartal), cembung, purnama (pilih 4)." },
  { id: 5, category: "TEBAK GAMBAR", text: "Planet manakah ini? Petunjuk: cincinnya paling terkenal!", emoji: "🪐", answer: "Saturnus" },
  { id: 6, category: "TEBAK GAMBAR", text: "Benda langit apakah ini? Petunjuk: berjuluk bintang berekor!", emoji: "☄️", answer: "Komet" },
  { id: 7, category: "TEBAK GAMBAR", text: "Gambar apakah ini? Petunjuk: satelit alami Bumi!", emoji: "🌕", answer: "Bulan (purnama)" },
  { id: 8, category: "TEBAK GAMBAR", text: "Kendaraan apakah ini? Petunjuk: membawa astronaut ke luar angkasa!", emoji: "🚀", answer: "Roket" },
  { id: 9, category: "TANTANGAN GERAK", text: "Peragakan bersama kelompokmu: satu teman menjadi Matahari di tengah, yang lain bergerak mengelilinginya seperti planet selama 10 detik!", answer: "Semua anggota ikut bergerak mengorbit dengan tertib — inilah revolusi!" },
  { id: 10, category: "TANTANGAN GERAK", text: "Peragakan rotasi dan revolusi sekaligus: satu teman berputar di tempat (rotasi) sambil berjalan mengelilingi “Matahari” (revolusi)!", answer: "Gerakan berputar di tempat sambil mengorbit dilakukan bersamaan." },
  { id: 11, category: "TANTANGAN GERAK", text: "Tanpa bersuara, peragakan “astronaut berjalan di Bulan” yang melayang-layang, dan biarkan kelompok menebaknya dalam 15 detik!", answer: "Gerakan langkah lambat memantul khas gravitasi rendah." },
  { id: 12, category: "TANTANGAN INGATAN", text: "Hafalkan 5 nama planet yang muncul di layar secara berurutan. Setelah hilang, sebutkan urutannya!", memoryWords: ["Merkurius", "Venus", "Bumi", "Mars", "Jupiter"], answer: "Menyebutkan urutan 5 planet dengan benar (minimal 4 tepat)." },
  { id: 13, category: "TANTANGAN INGATAN", text: "Hafalkan 5 kata antariksa yang muncul di layar. Setelah kata menghilang, sebutkan semuanya!", memoryWords: ["Komet", "Bulan", "Roket", "Bintang", "Orbit"], answer: "Menyebutkan minimal 4 dari 5 kata." },
  { id: 14, category: "TANTANGAN INGATAN", text: "Hafalkan 5 angka “kode peluncuran” di layar secara berurutan, lalu sebutkan seperti aba-aba peluncuran roket!", memoryWords: ["5", "4", "3", "2", "1"], answer: "Menyebutkan 5-4-3-2-1 dengan urutan benar, lantang dan kompak." },
  { id: 15, category: "KERJA SAMA", text: "Buat satu kalimat bermakna tentang tata surya: setiap anggota menyumbang SATU kata secara bergiliran, minimal 5 kata!", answer: "Kalimat runtut dan bermakna, semua anggota menyumbang kata." },
  { id: 16, category: "KERJA SAMA", text: "Hitung mundur peluncuran roket bersama! Bergantian antar anggota sebutkan kelipatan 3 dari 3 sampai 30 tanpa salah dan tanpa jeda lebih dari 3 detik!", answer: "3, 6, 9, 12, 15, 18, 21, 24, 27, 30 disebutkan bergiliran." },
  { id: 17, category: "KERJA SAMA", text: "Bergiliran, tiap anggota menyebutkan satu planet sesuai urutannya dari yang terdekat dengan Matahari. Kumpulkan 8 planet tanpa tertukar!", answer: "Merkurius → Venus → Bumi → Mars → Jupiter → Saturnus → Uranus → Neptunus." },
  { id: 18, category: "TEKA-TEKI", text: "“Aku punya cincin, tetapi bukan jari. Aku planet kelima yang… eh, keenam! Siapakah aku?”", answer: "Saturnus (planet keenam, bercincin indah)." },
  { id: 19, category: "TEKA-TEKI", text: "“Aku tidak punya cahaya sendiri, tetapi malam-malam aku bersinar. Aku menemani Bumi. Siapakah aku?”", answer: "Bulan — memantulkan cahaya Matahari." },
  { id: 20, category: "TEKA-TEKI", text: "“Semakin aku mendekat kepada Matahari, semakin panjang ekorku. Siapakah aku?”", answer: "Komet" },
  { id: 21, category: "TEKA-TEKI", text: "“Aku berputar tanpa henti hingga siang berganti malam, tetapi kau tak pernah merasakan aku bergerak. Gerakan apakah aku?”", answer: "Rotasi Bumi" },
];

export function randomChallenge(excludeId?: number): Challenge {
  const pool = CHALLENGES.filter((c) => c.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}
