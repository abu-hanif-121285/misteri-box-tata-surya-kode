import type { Question } from "../types";

export const DEFAULT_BANK_NAME = "Bank soal bawaan — Tata Surya (30 soal kelas 6 SD)";

/**
 * Bank soal bawaan: TATA SURYA — kelas 6 SD.
 * Komposisi tetap: 14 PG, 6 BENAR_SALAH, 6 ISIAN, 4 URAIAN.
 * Diadaptasi dari naskah guru (15 PG + 15 isian) beserta kunci jawabannya.
 */
export const DEFAULT_QUESTIONS: Question[] = [
  // ===== PILIHAN GANDA (1–14) =====
  { no: 1, type: "PG", text: "Pusat tata surya adalah …", options: ["Matahari", "Bumi", "Bulan", "Jupiter"], key: "A", explanation: "Matahari adalah pusat tata surya; semua planet mengelilinginya karena gaya gravitasinya." },
  { no: 2, type: "PG", text: "Planet yang paling dekat dengan Matahari adalah …", options: ["Venus", "Merkurius", "Mars", "Bumi"], key: "B", explanation: "Urutan planet dari yang terdekat: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus." },
  { no: 3, type: "PG", text: "Planet terbesar dalam tata surya adalah …", options: ["Saturnus", "Neptunus", "Jupiter", "Uranus"], key: "C", explanation: "Jupiter adalah planet terbesar dengan diameter sekitar 142.984 km." },
  { no: 4, type: "PG", text: "Planet yang dijuluki planet merah adalah …", options: ["Venus", "Mars", "Merkurius", "Jupiter"], key: "B", explanation: "Permukaan Mars tampak kemerahan karena kandungan oksida besi (karat) pada tanahnya." },
  { no: 5, type: "PG", text: "Planet yang terkenal dengan cincinnya yang indah adalah …", options: ["Bumi", "Mars", "Saturnus", "Merkurius"], key: "C", explanation: "Cincin Saturnus tersusun dari bongkahan es, debu, dan batuan." },
  { no: 6, type: "PG", text: "Banyaknya planet yang mengelilingi Matahari dalam tata surya kita adalah … planet.", options: ["7", "8", "9", "10"], key: "B", explanation: "Sejak 2006 Pluto tidak lagi digolongkan planet, sehingga jumlah planet ada 8." },
  { no: 7, type: "PG", text: "Planet tempat tinggal kita, yang menjadi satu-satunya planet yang diketahui dihuni makhluk hidup, adalah …", options: ["Mars", "Venus", "Bumi", "Neptunus"], key: "C", explanation: "Bumi memiliki air, udara, dan suhu yang sesuai untuk kehidupan." },
  { no: 8, type: "PG", text: "Planet yang paling jauh dari Matahari adalah …", options: ["Uranus", "Saturnus", "Jupiter", "Neptunus"], key: "D", explanation: "Neptunus adalah planet kedelapan sekaligus terjauh dari Matahari." },
  { no: 9, type: "PG", text: "Planet yang terkecil adalah planet …", options: ["Merkurius", "Mars", "Venus", "Bumi"], key: "A", explanation: "Merkurius adalah planet terkecil, diameternya hanya sekitar 4.879 km." },
  { no: 10, type: "PG", text: "Planet yang suhu permukaannya paling panas dalam tata surya adalah …", options: ["Merkurius", "Venus", "Mars", "Jupiter"], key: "B", explanation: "Venus paling panas (±465°C) karena atmosfer tebalnya memerangkap panas (efek rumah kaca)." },
  { no: 11, type: "PG", text: "Gerakan Bumi berputar pada porosnya disebut …", options: ["Revolusi", "Rotasi", "Orbit", "Gravitasi"], key: "B", explanation: "Rotasi Bumi menyebabkan terjadinya siang dan malam." },
  { no: 12, type: "PG", text: "Gerakan Bumi mengelilingi Matahari disebut …", options: ["Rotasi", "Revolusi", "Gerhana", "Presesi"], key: "B", explanation: "Revolusi Bumi menyebabkan pergantian musim dan penetapan satu tahun." },
  { no: 13, type: "PG", text: "Satu kali rotasi Bumi memerlukan waktu sekitar … jam.", options: ["12", "18", "24", "36"], key: "C", explanation: "Bumi berotasi satu putaran penuh dalam ±24 jam (satu hari)." },
  { no: 14, type: "PG", text: "Satu kali revolusi Bumi memerlukan waktu sekitar … hari.", options: ["30 hari", "180", "365", "730"], key: "C", explanation: "Bumi mengelilingi Matahari dalam ±365 hari (satu tahun)." },

  // ===== BENAR / SALAH (15–20) =====
  { no: 15, type: "BENAR_SALAH", text: "Satelit alami Bumi adalah Bulan.", options: [], key: "BENAR", explanation: "Bulan adalah satu-satunya satelit alami Bumi, mengelilingi Bumi sambil mengikutinya mengelilingi Matahari." },
  { no: 16, type: "BENAR_SALAH", text: "Bulan tampak bercahaya karena memantulkan cahaya dari Matahari.", options: [], key: "BENAR", explanation: "Bulan tidak memancarkan cahaya sendiri; permukaannya memantulkan cahaya Matahari." },
  { no: 17, type: "BENAR_SALAH", text: "Planet yang dijuluki planet merah adalah Venus.", options: [], key: "SALAH", explanation: "Yang dijuluki planet merah adalah Mars, bukan Venus." },
  { no: 18, type: "BENAR_SALAH", text: "Galaksi tempat tata surya kita berada bernama Andromeda.", options: [], key: "SALAH", explanation: "Tata surya kita berada di galaksi Bima Sakti. Andromeda adalah galaksi tetangga." },
  { no: 19, type: "BENAR_SALAH", text: "Kalender Syamsiyah disusun berdasarkan peredaran Bulan mengelilingi Bumi.", options: [], key: "SALAH", explanation: "Syamsiyah berdasarkan peredaran Bumi mengelilingi Matahari; yang berdasarkan peredaran Bulan adalah kalender Komariah." },
  { no: 20, type: "BENAR_SALAH", text: "Meteor tampak seperti bintang jatuh karena terbakar saat memasuki atmosfer Bumi.", options: [], key: "BENAR", explanation: "Gesekan dengan atmosfer membuat meteor terbakar dan berpijar seperti bintang jatuh." },

  // ===== ISIAN SINGKAT (21–26) =====
  { no: 21, type: "ISIAN", text: "Fase Bulan ketika seluruh permukaan Bulan yang menghadap Bumi tampak bulat terang disebut …", options: [], key: "Bulan purnama", explanation: "Saat purnama, posisi Bumi berada di antara Matahari dan Bulan sehingga sisi Bulan yang menghadap Bumi terang penuh." },
  { no: 22, type: "ISIAN", text: "Kalender yang berdasarkan peredaran Bulan disebut kalender …", options: [], key: "Komariah (Hijriah)", explanation: "Kalender Komariah/Hijriah memakai peredaran Bulan; satu bulannya 29–30 hari." },
  { no: 23, type: "ISIAN", text: "Satu siklus fase Bulan dari bulan baru hingga kembali bulan baru berlangsung sekitar … hari.", options: [], key: "29,5 hari (diterima 29–30 hari)", explanation: "Satu siklus fase Bulan ±29,5 hari; jawaban 29 atau 30 hari diterima." },
  { no: 24, type: "ISIAN", text: "Galaksi tempat tata surya kita berada bernama …", options: [], key: "Bima Sakti", explanation: "Tata surya kita merupakan bagian kecil dari galaksi Bima Sakti." },
  { no: 25, type: "ISIAN", text: "Satelit buatan pertama adalah …", options: [], key: "Sputnik (Sputnik 1)", explanation: "Sputnik 1 diluncurkan Uni Soviet pada 4 Oktober 1957 — satelit buatan pertama di dunia." },
  { no: 26, type: "ISIAN", text: "Benda langit yang berekor ketika mendekati Matahari dan mengelilingi Matahari dalam orbit lonjong disebut …", options: [], key: "Komet", explanation: "Ekor komet terbentuk dari es dan debu yang menguap saat mendekati Matahari; arahnya menjauhi Matahari." },

  // ===== URAIAN (27–30) =====
  { no: 27, type: "URAIAN", text: "Jelaskan apa yang dimaksud dengan jagat raya dan galaksi!", options: [], key: "Jagat raya (alam semesta) = seluruh ruang angkasa beserta isinya. Galaksi = kumpulan miliaran bintang, gas, dan debu antariksa yang terikat oleh gaya gravitasi.", explanation: "Benar jika siswa menjelaskan jagat raya sebagai seluruh ruang angkasa beserta isinya, dan galaksi sebagai kumpulan miliaran bintang yang terikat gravitasi." },
  { no: 28, type: "URAIAN", text: "Di manakah letak sabuk asteroid, dan apakah asteroid itu? Jelaskan!", options: [], key: "Sabuk asteroid terletak di antara orbit planet Mars dan Jupiter. Asteroid adalah pecahan batuan angkasa berukuran kecil yang mengelilingi Matahari.", explanation: "Benar jika menyebut letak antara Mars–Jupiter dan menjelaskan asteroid sebagai batuan angkasa yang mengorbit Matahari." },
  { no: 29, type: "URAIAN", text: "Sebutkan 3 jenis satelit buatan beserta kegunaannya bagi kehidupan sehari-hari!", options: [], key: "Satelit komunikasi (TV, telepon, internet), satelit navigasi (peta digital/GPS), satelit cuaca (memperkirakan cuaca).", explanation: "Benar jika menyebut 3 jenis satelit — komunikasi, navigasi, cuaca — beserta kegunaan yang tepat." },
  { no: 30, type: "URAIAN", text: "Jelaskan perbedaan rotasi dan revolusi Bumi beserta waktu yang dibutuhkan masing-masing!", options: [], key: "Rotasi = Bumi berputar pada porosnya, ±24 jam, menyebabkan siang–malam. Revolusi = Bumi mengelilingi Matahari, ±365 hari, menyebabkan pergantian musim dan satu tahun.", explanation: "Benar jika membedakan pengertian rotasi & revolusi serta menyebut waktu ±24 jam dan ±365 hari." },
];
