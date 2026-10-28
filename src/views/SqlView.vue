<script setup lang="ts">
import { ref } from 'vue';
import { useSchemaStore } from '../stores/schemaStore';
import SqlViewer from '../components/SqlViewer.vue';
import {
  Code2,
  Database,
  Sliders,
  Download,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  Settings2,
} from 'lucide-vue-next';

const schemaStore = useSchemaStore();
const showAdvancedConfig = ref(false);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Code2 class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-extrabold text-white">SQL Script Generator & Direct Download</h1>
          <p class="text-xs text-slate-400">
            Hasilkan skrip DDL/DML siap eksekusi untuk MySQL atau PostgreSQL, lengkap dengan relasi & opsi data.
          </p>
        </div>
      </div>

      <!-- Quick Toggles -->
      <div class="flex items-center gap-3">
        <!-- Dialect Toggle Pill -->
        <div class="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <button
            @click="schemaStore.setDialect('mysql')"
            :class="[
              'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer',
              schemaStore.sqlOptions.dialect === 'mysql'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            MySQL
          </button>
          <button
            @click="schemaStore.setDialect('postgres')"
            :class="[
              'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer',
              schemaStore.sqlOptions.dialect === 'postgres'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            ]"
          >
            PostgreSQL
          </button>
        </div>

        <button
          @click="showAdvancedConfig = !showAdvancedConfig"
          :class="[
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer',
            showAdvancedConfig
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          ]"
        >
          <Settings2 class="w-3.5 h-3.5 text-indigo-400" />
          <span>Opsi SQL</span>
        </button>
      </div>
    </div>

    <!-- SQL Generation Options Panel -->
    <div
      v-show="showAdvancedConfig"
      class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders class="w-4 h-4 text-cyan-400" />
          <span>Konfigurasi Generator SQL</span>
        </h3>
        <span class="text-[11px] text-slate-400">Pengaturan ini langsung memperbarui skrip di bawah</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <!-- Option 1: Include Data -->
        <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
          <input
            type="checkbox"
            v-model="schemaStore.sqlOptions.includeData"
            class="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <div>
            <div class="font-bold text-slate-200">Sertakan Data (INSERT)</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Generate perintah INSERT INTO untuk semua data sampel dari JSON.</p>
          </div>
        </label>

        <!-- Option 2: Include Drop Table -->
        <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
          <input
            type="checkbox"
            v-model="schemaStore.sqlOptions.includeDropTable"
            class="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <div>
            <div class="font-bold text-slate-200">DROP TABLE IF EXISTS</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Urutan drop tabel terbalik untuk menghindari error Foreign Key.</p>
          </div>
        </label>

        <!-- Option 3: Create Database / Schema -->
        <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
          <input
            type="checkbox"
            v-model="schemaStore.sqlOptions.includeCreateDatabase"
            class="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <div>
            <div class="font-bold text-slate-200">CREATE DATABASE / SCHEMA</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Buat database baru secara otomatis sebelum definisi tabel.</p>
          </div>
        </label>

        <!-- Option 4: Use Transactions -->
        <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700">
          <input
            type="checkbox"
            v-model="schemaStore.sqlOptions.useTransactions"
            class="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <div>
            <div class="font-bold text-slate-200">Gunakan Transaksi</div>
            <p class="text-[11px] text-slate-400 mt-0.5">Bungkus skrip dalam START TRANSACTION / BEGIN dan COMMIT.</p>
          </div>
        </label>
      </div>

      <!-- Specific Dialect Settings -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Nama Database</label>
          <input
            type="text"
            v-model="schemaStore.sqlOptions.databaseName"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div v-if="schemaStore.sqlOptions.dialect === 'mysql'">
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">MySQL Storage Engine</label>
          <select
            v-model="schemaStore.sqlOptions.mysqlEngine"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="InnoDB">InnoDB (ACID, Foreign Keys & Transaksi)</option>
            <option value="MyISAM">MyISAM (Non-transaksional)</option>
          </select>
        </div>

        <div v-if="schemaStore.sqlOptions.dialect === 'postgres'">
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">PostgreSQL Auto-ID Syntax</label>
          <select
            v-model="schemaStore.sqlOptions.postgresIdentityStyle"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="identity">GENERATED ALWAYS AS IDENTITY (SQL Standard Baru)</option>
            <option value="serial">BIGSERIAL / SERIAL (Klasik)</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Batch Insert Chunk Size</label>
          <input
            type="number"
            v-model.number="schemaStore.sqlOptions.batchInsertSize"
            min="10"
            max="1000"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>

    <!-- Main SQL Code Viewer Component with direct download button -->
    <div class="h-[680px]">
      <SqlViewer />
    </div>
  </div>
</template>
