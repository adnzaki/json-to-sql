<script setup lang="ts">
import { useSchemaStore } from '../stores/schemaStore';
import {
  SlidersHorizontal,
  Wand2,
  Database,
  CheckCircle2,
  Table,
  Cpu,
  Layers,
} from 'lucide-vue-next';

const schemaStore = useSchemaStore();

const applyAndReconvert = () => {
  schemaStore.runConversion();
};
</script>

<template>
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-200">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
          <SlidersHorizontal class="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Aturan Optimasi & Normalisasi</h3>
          <p class="text-[11px] text-slate-400">Konfigurasi struktur tabel otomatis MySQL & PostgreSQL</p>
        </div>
      </div>

      <button
        @click="applyAndReconvert"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
      >
        <Wand2 class="w-3.5 h-3.5" />
        <span>Terapkan & Re-Analisis</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- 1. Normalization Strategy -->
      <div class="space-y-2.5">
        <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers class="w-3.5 h-3.5 text-cyan-400" />
          Level Normalisasi Data
        </label>
        <div class="space-y-2">
          <label
            :class="[
              'flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition',
              schemaStore.optimizationOptions.normalizationLevel === '3nf_relational'
                ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]"
          >
            <input
              type="radio"
              v-model="schemaStore.optimizationOptions.normalizationLevel"
              value="3nf_relational"
              @change="applyAndReconvert"
              class="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div class="font-bold flex items-center gap-1">
                <span>Relasional Penuh (3NF)</span>
                <span class="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Rekomendasi</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Pecah objek & array bersarang menjadi tabel anak terpisah dengan Foreign Key & ON DELETE CASCADE.
              </p>
            </div>
          </label>

          <label
            :class="[
              'flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition',
              schemaStore.optimizationOptions.normalizationLevel === '1nf'
                ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]"
          >
            <input
              type="radio"
              v-model="schemaStore.optimizationOptions.normalizationLevel"
              value="1nf"
              @change="applyAndReconvert"
              class="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div class="font-bold">1NF (Flatten Prefix)</div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Ratakan properti objek ke kolom tabel utama (misal: address_city), array objek tetap jadi tabel terpisah.
              </p>
            </div>
          </label>

          <label
            :class="[
              'flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition',
              schemaStore.optimizationOptions.normalizationLevel === 'flat'
                ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            ]"
          >
            <input
              type="radio"
              v-model="schemaStore.optimizationOptions.normalizationLevel"
              value="flat"
              @change="applyAndReconvert"
              class="mt-0.5 text-indigo-600 focus:ring-0"
            />
            <div>
              <div class="font-bold">No-SQL Document Mode (Flat)</div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Simpan semua array dan nested object langsung sebagai tipe kolom JSON / JSONB.
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- 2. Primary Key & Naming -->
      <div class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Cpu class="w-3.5 h-3.5 text-amber-400" />
            Strategi Primary Key (ID)
          </label>
          <select
            v-model="schemaStore.optimizationOptions.idStrategy"
            @change="applyAndReconvert"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="bigint_auto">BIGINT Auto-Increment / BIGSERIAL (Standar Skalabilitas Tinggi)</option>
            <option value="uuid">UUID v4 (ID Acak Terdistribusi / Non-Enumerable)</option>
            <option value="int_auto">INT Auto-Increment / SERIAL (Ringan untuk Data Sedang)</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Table class="w-3.5 h-3.5 text-emerald-400" />
            Konvensi Penamaan (Identifier)
          </label>
          <select
            v-model="schemaStore.optimizationOptions.caseConvention"
            @change="applyAndReconvert"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="snake_case">snake_case (Standar Industri SQL / snake_casing)</option>
            <option value="camelCase">camelCase (Format JavaScript / Prisma)</option>
            <option value="preserve">Pertahankan Nama Asli di JSON</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Database class="w-3.5 h-3.5 text-indigo-400" />
            Nama Database / Schema SQL
          </label>
          <input
            type="text"
            v-model="schemaStore.sqlOptions.databaseName"
            placeholder="my_database"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <!-- 3. Automated Constraints & Fields -->
      <div class="space-y-3">
        <label class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <CheckCircle2 class="w-3.5 h-3.5 text-purple-400" />
          Otomatisasi Kolom & Performa
        </label>

        <div class="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="schemaStore.optimizationOptions.pluralizeTableNames"
              @change="applyAndReconvert"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span class="text-slate-300">Pluralisasi Nama Tabel (order ➔ orders)</span>
          </label>

          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="schemaStore.optimizationOptions.addTimestamps"
              @change="applyAndReconvert"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span class="text-slate-300">Sertakan Audit Timestamp (<code class="text-indigo-300">created_at</code>, <code class="text-indigo-300">updated_at</code>)</span>
          </label>

          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="schemaStore.optimizationOptions.addSoftDelete"
              @change="applyAndReconvert"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span class="text-slate-300">Sertakan Soft Delete (<code class="text-indigo-300">deleted_at</code>)</span>
          </label>

          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="schemaStore.optimizationOptions.autoIndexForeignKeys"
              @change="applyAndReconvert"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span class="text-slate-300">Index Otomatis pada Foreign Keys (<code class="text-cyan-300">IDX_</code>)</span>
          </label>

          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="schemaStore.sqlOptions.includeData"
              class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span class="text-slate-300 font-semibold text-amber-300">Sertakan Data Asli (INSERT INTO)</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
