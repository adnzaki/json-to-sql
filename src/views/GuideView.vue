<script setup lang="ts">
import {
  BookOpen,
  CheckCircle2,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-vue-next';
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
    <!-- Header -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
        <BookOpen class="w-3.5 h-3.5 text-cyan-400" />
        <span>Panduan Arsitektur Basis Data</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-extrabold text-white">
        Normalisasi & Optimasi Skema MySQL vs PostgreSQL
      </h1>
      <p class="text-sm text-slate-300 mt-2 leading-relaxed">
        Pelajari bagaimana SchemaCraft mentransformasikan struktur JSON non-relasional menjadi tabel relasional yang bersih, efisien, dan bebas redundansi data.
      </p>
    </div>

    <!-- 1. Normalization Levels -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <Layers class="w-4 h-4 text-indigo-400" />
        </div>
        <h2 class="text-lg font-bold text-white">Prinsip Normalisasi Data (1NF, 2NF, 3NF)</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 1NF -->
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-cyan-400">1NF (First Normal Form)</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Nilai Atomik</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Setiap kolom hanya boleh menyimpan satu nilai tunggal (atomik), tidak boleh ada array nilai atau kelompok kolom yang berulang. Objek nested diratakan (flat prefix).
          </p>
        </div>

        <!-- 2NF -->
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-indigo-400">2NF (Second Normal Form)</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Full Functional</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Harus memenuhi 1NF, dan semua atribut non-kunci harus sepenuhnya bergantung pada Primary Key (tidak ada ketergantungan parsial).
          </p>
        </div>

        <!-- 3NF -->
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-purple-400">3NF (Third Normal Form)</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">No Transitive</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Harus memenuhi 2NF, dan tidak boleh ada ketergantungan transitif. Contoh: data customer dan address dipisah ke tabel sendiri dengan Foreign Key.
          </p>
        </div>
      </div>
    </div>

    <!-- 2. MySQL vs PostgreSQL Comparison Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Database class="w-4 h-4 text-cyan-400" />
        </div>
        <h2 class="text-lg font-bold text-white">Komparasi Tipe Data: MySQL vs PostgreSQL</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left font-mono">
          <thead class="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
            <tr>
              <th class="px-4 py-2.5">Kategori Data</th>
              <th class="px-4 py-2.5 text-amber-400">MySQL 8.0+</th>
              <th class="px-4 py-2.5 text-cyan-400">PostgreSQL 14+</th>
              <th class="px-4 py-2.5 text-slate-300 font-sans">Kelebihan & Rekomendasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-950/40 text-slate-300">
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Auto-Increment ID</td>
              <td class="px-4 py-2.5 text-amber-300">BIGINT AUTO_INCREMENT</td>
              <td class="px-4 py-2.5 text-cyan-300">BIGINT GENERATED ALWAYS AS IDENTITY</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">Standar modern SQL untuk primary key angka yang tidak habis.</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Identitas UUID</td>
              <td class="px-4 py-2.5 text-amber-300">VARCHAR(36)</td>
              <td class="px-4 py-2.5 text-cyan-300">UUID</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">PostgreSQL memiliki tipe native 16-byte yang jauh lebih hemat memori dibanding string.</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Teks Panjang</td>
              <td class="px-4 py-2.5 text-amber-300">TEXT / LONGTEXT</td>
              <td class="px-4 py-2.5 text-cyan-300">TEXT</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">Di PostgreSQL tipe TEXT tidak memiliki penalti performa dibanding VARCHAR.</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Tanggal & Waktu</td>
              <td class="px-4 py-2.5 text-amber-300">DATETIME / TIMESTAMP</td>
              <td class="px-4 py-2.5 text-cyan-300">TIMESTAMP WITH TIME ZONE</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">TIMESTAMPTZ di Postgres mencegah kebingungan zona waktu server vs klien.</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Dokumen JSON</td>
              <td class="px-4 py-2.5 text-amber-300">JSON</td>
              <td class="px-4 py-2.5 text-cyan-300">JSONB</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">JSONB di PostgreSQL diindeks secara biner (GIN index) untuk query instan.</td>
            </tr>
            <tr>
              <td class="px-4 py-2.5 font-bold font-sans">Boolean</td>
              <td class="px-4 py-2.5 text-amber-300">TINYINT(1)</td>
              <td class="px-4 py-2.5 text-cyan-300">BOOLEAN</td>
              <td class="px-4 py-2.5 font-sans text-slate-400 text-[11px]">Postgres memiliki boolean murni (TRUE/FALSE), MySQL mengalias TINYINT(1).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. Pro Optimization Tips -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div class="flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-400" />
          <h3 class="text-sm font-bold text-white">Tips Performa & Indexing</h3>
        </div>
        <ul class="space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
          <li>Selalu tambahkan <strong class="text-slate-200">Index</strong> pada setiap kolom Foreign Key (`..._id`) untuk mempercepat operasi JOIN hingga 100x lipat.</li>
          <li>Hindari menggunakan <strong class="text-slate-200">VARCHAR(255)</strong> sembarangan jika datanya hanya kode 2 karakter; SchemaCraft mengoptimalkannya secara otomatis.</li>
          <li>Gunakan <strong class="text-slate-200">CURRENT_TIMESTAMP</strong> pada default `created_at` agar pencatatan waktu ditangani langsung di database engine.</li>
        </ul>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div class="flex items-center gap-2">
          <ShieldAlert class="w-4 h-4 text-emerald-400" />
          <h3 class="text-sm font-bold text-white">Keamanan & Integritas Relasi</h3>
        </div>
        <ul class="space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
          <li>Gunakan <strong class="text-slate-200">ON DELETE CASCADE</strong> dengan bijak hanya untuk relasi parent-child murni (misal: order_items saat order dihapus).</li>
          <li>Untuk data penting seperti histori transaksi atau pembayaran, gunakan <strong class="text-slate-200">RESTRICT</strong> atau Soft Delete (`deleted_at`).</li>
          <li>Selalu gunakan <strong class="text-slate-200">utf8mb4</strong> di MySQL agar aman menyimpan emoji dan karakter internasional.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
