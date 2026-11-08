import { useState, type ReactNode } from "react";
import { Modal } from "./ui";
import { cn } from "../utils/cn";

const TABS = [
  { id: "main", label: "🎮 Cara Bermain" },
  { id: "guru", label: "🧑🏫 Panduan Guru" },
  { id: "pages", label: "🌐 GitHub Pages" },
  { id: "firebase", label: "🔥 Firebase" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function H({ children }: { children: ReactNode }) {
  return <h4 className="font-display mt-4 mb-1.5 text-sm text-gold-400 first:mt-0">{children}</h4>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm font-semibold leading-relaxed text-white/80">{children}</p>;
}

export default function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("main");
  return (
    <Modal open={open} onClose={onClose} title="📖 PETUNJUK MYSTERY BOX" wide>
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition", tab === t.id ? "bg-gold-500 text-navy-900" : "bg-navy-800 text-white/70 hover:text-gold-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "main" && (
        <div>
          <H>🎯 TUJUAN</H>
          <P>Kumpulkan poin sebanyak-banyaknya dengan menjawab soal di dalam 30 kotak misteri emas!</P>
          <H>📦 CARA BERMAIN</H>
          <P>1️⃣ Kelompok yang mendapat giliran memilih <b>satu kotak</b>. Nilai kotak (10–100 poin) terlihat di bagian luar.<br />
            2️⃣ Kotak terbuka secara dramatis… mungkin ada <b>kejutan</b> di dalamnya!<br />
            3️⃣ Jawab soal dalam <b>60 detik</b>. Soal Pilihan Ganda & Benar/Salah dinilai otomatis; Isian & Uraian dijawab lisan dan dinilai guru.<br />
            4️⃣ Jawaban salah / waktu habis? Soal <b>dilempar sekali</b> ke kelompok lain yang dipilih acak — kesempatan mereka juga 60 detik dengan nilai penuh.<br />
            5️⃣ Jika kelompok penerima juga salah, soal <b>gugur</b> (tidak ada poin).<br />
            6️⃣ Giliran memilih kotak selalu berurutan: Kelompok 1 → 2 → 3 → … → kembali ke 1. Penerima lemparan <b>tidak</b> mendapat giliran memilih tambahan.</P>
          <H>⚡ TIGA KEJUTAN (satu kotak maksimal satu kejutan)</H>
          <P>🎁 <b className="text-limex">BONUS POINT</b> — jawab benar, dapat tambahan <b>+50 poin</b>.<br />
            ✖ <b className="text-cyanx">DOUBLE POINT</b> — jawab benar, nilai kotak <b>dikalikan 2</b> (contoh: 80 → 160). Berlaku juga bagi penerima lemparan.<br />
            ⚡ <b className="text-magentax">SPECIAL CHALLENGE</b> — setelah jawab benar, muncul tantangan seru <b>30 detik</b> (jawab cepat, tebak gambar, gerak, ingatan, kerja sama, teka-teki). Berhasil = <b>+50 poin</b>; gagal tidak mengurangi poin soal.</P>
          <H>🏆 PEMENANG</H>
          <P>Setelah 30 kotak habis, kelompok dengan poin tertinggi menjadi juara. Nilai sama = peringkat sama!</P>
        </div>
      )}

      {tab === "guru" && (
        <div>
          <H>1. PERSIAPAN</H>
          <P>Tekan <b>MULAI PERMAINAN</b> atau <b>MODE GURU</b> → masukkan <b>password guru</b> → atur jumlah & nama kelompok (min. 2) → durasi timer → bank soal. Seluruh area guru (persiapan, upload / download template, preview soal, panel kontrol) <b>hanya dapat diakses dengan password</b>; siswa cukup menonton layar permainan. Guru dapat menekan <b>🔒 Kunci Mode Guru</b> kapan saja agar akses terkunci kembali.</P>
          <H>2. BANK SOAL EXCEL</H>
          <P>Tekan <b>DOWNLOAD TEMPLATE SOAL</b> (sheet <b>BANK SOAL</b> + <b>PETUNJUK</b>). Isi <b>tepat 30 soal</b> dengan kolom: Nomor, Jenis Soal (PG / BENAR_SALAH / ISIAN / URAIAN), Pertanyaan, Opsi A–D, Kunci Jawaban, Pembahasan (opsional).<br />
            • PG: 4 opsi wajib, kunci A/B/C/D. • BENAR_SALAH: kunci BENAR/SALAH. • ISIAN & URAIAN: kunci = panduan guru.<br />
            • <b>Jangan isi nilai poin</b> — nilai kotak dibuat otomatis & acak.<br />
            Unggah lewat <b>UPLOAD FILE EXCEL</b>; sistem memvalidasi jumlah, jenis, kelengkapan, dan kunci. Jika ada kesalahan, nomor soal & jenis kesalahannya ditampilkan. Permainan hanya bisa dimulai bila valid.</P>
          <H>3. MENJALANKAN GAME</H>
          <P>Hubungkan laptop ke proyektor (HDMI). Gunakan <b>MODE PROYEKTOR</b> untuk tampilan siswa (kunci jawaban & kontrol admin tersembunyi), dan <b>PANEL GURU</b> untuk mengontrol: pause/resume, lewati/batalkan soal, penilaian BENAR/SALAH, koreksi poin, timer (atur/tambah/kurang/reset/stop), volume audio, dan pembahasan.</P>
          <H>4. HASIL & LAPORAN</H>
          <P>Di halaman hasil: <b>DOWNLOAD PDF</b> (rekap, peringkat, riwayat, rincian) dan <b>DOWNLOAD EXCEL</b> (REKAP SKOR, RIWAYAT PERMAINAN, RINCIAN NILAI). Semua data berasal dari permainan sebenarnya dan <b>tidak disimpan permanen</b> — ekspor sebelum menutup aplikasi. <b>PERMAINAN BARU</b> mengacak ulang soal, nilai, dan kejutan.</P>
          <H>🔐 CATATAN KEAMANAN</H>
          <P>Password guru hanya pembatas antarmuka di sisi klien, <b>bukan</b> keamanan kuat terhadap orang yang dapat membaca kode sumber. Autentikasi yang sesungguhnya membutuhkan backend.</P>
        </div>
      )}

      {tab === "pages" && (
        <div>
          <H>PUBLIKASI GRATIS DENGAN GITHUB PAGES</H>
          <P>Hasil build aplikasi ini adalah <b>satu file index.html</b> mandiri, sehingga sangat mudah dipublikasikan:</P>
          <P>1️⃣ Buat repositori baru di GitHub, misalnya <b>mystery-box</b>.<br />
            2️⃣ Unggah file <b>index.html</b> hasil build (folder <code className="rounded bg-navy-950 px-1">dist/</code>) ke repositori tersebut.<br />
            3️⃣ Buka <b>Settings → Pages</b> → Source: <b>Deploy from a branch</b> → Branch: <b>main</b>, folder <b>/ (root)</b> → Save.<br />
            4️⃣ Tunggu ±1 menit, aplikasi dapat diakses di <code className="rounded bg-navy-950 px-1">https://username.github.io/mystery-box/</code>.<br />
            5️⃣ Bagikan alamat tersebut; guru cukup membukanya di browser laptop/ponsel.</P>
          <H>ALTERNATIF</H>
          <P>Karena berbentuk satu file HTML, aplikasi juga bisa dibuka langsung dari komputer (klik dua kali index.html) atau dibagikan lewat flashdisk. Musik & efek suara dibuat dengan Web Audio sehingga tidak butuh file tambahan.</P>
        </div>
      )}

      {tab === "firebase" && (
        <div>
          <H>MODE DUA PERANGKAT (OPSIONAL)</H>
          <P>Laptop = layar proyektor (host). Ponsel guru = remote control. Keduanya tersinkron real-time (soal, timer, skor, status) melalui <b>Firebase Realtime Database</b>. <b>Tanpa konfigurasi Firebase, fitur ini tidak aktif</b> — mode satu perangkat tetap berfungsi penuh.</P>
          <H>LANGKAH KONFIGURASI</H>
          <P>1️⃣ Buka <b>console.firebase.google.com</b> → <b>Add project</b> (gratis, paket Spark).<br />
            2️⃣ Di proyek: <b>Build → Realtime Database → Create Database</b> (pilih lokasi, mode uji coba untuk sesi kelas).<br />
            3️⃣ Pada aturan Rules, untuk pemakaian kelas dengan kode sesi acak, contoh sederhana:<br />
            <code className="mt-1 block rounded-lg bg-navy-950 p-2 font-mono text-[11px] text-cyanx">{`{ "rules": { "sessions": { "$code": { ".read": true, ".write": true } } } }`}</code>
            <span className="text-white/55">Catatan: aturan ini terbuka demi kemudahan kelas — hapus data sesi setelah selesai, atau perketat dengan Firebase Authentication bila diperlukan.</span><br />
            4️⃣ <b>Project settings → General → Your apps → Web app (&lt;/&gt;)</b> → daftarkan aplikasi → salin objek <b>firebaseConfig</b>.<br />
            5️⃣ Di aplikasi ini: <b>Panel Guru → Sesi</b> → tempel konfigurasi JSON (wajib ada <b>databaseURL</b>) → <b>SIMPAN</b>.<br />
            6️⃣ Di laptop: <b>BUAT SESI</b> → muncul <b>kode sesi 6 huruf</b>.<br />
            7️⃣ Di ponsel: halaman awal → <b>Hubungkan Remote Guru</b> → masukkan kode → ponsel menjadi remote (pilih kotak, nilai jawaban, kontrol timer, lanjut soal).</P>
          <H>PRIVASI</H>
          <P>Yang disinkronkan hanya status permainan sesi aktif di bawah kode acak; tidak ada database hasil permanen. Akhiri sesi dari Panel Guru untuk menghapus data sesi dari Firebase.</P>
        </div>
      )}

      <p className="mt-5 border-t border-gold-500/20 pt-3 text-center text-xs font-bold text-gold-400/80">MYSTERY BOX — created by wiyanto abu hanif</p>
    </Modal>
  );
}
