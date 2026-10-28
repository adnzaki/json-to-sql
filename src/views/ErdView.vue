<script setup lang="ts">
import { ref } from 'vue';
import { useSchemaStore } from '../stores/schemaStore';
import ErdCanvas from '../components/ErdCanvas.vue';
import {
  GitBranch,
  Database,
  ArrowRight,
  Code2,
  Table as TableIcon,
  Link2,
  Sliders,
} from 'lucide-vue-next';

const schemaStore = useSchemaStore();
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <GitBranch class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-extrabold text-white">Visual Entity Relationship Diagram (ERD)</h1>
          <p class="text-xs text-slate-400">
            Diagram visual interaktif relasi tabel. Tarik kartu tabel untuk mengatur tata letak, amati garis relasi Foreign Key.
          </p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2.5">
        <router-link
          to="/"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <Sliders class="w-3.5 h-3.5 text-indigo-400" />
          <span>Edit Struktur / JSON</span>
        </router-link>

        <router-link
          to="/sql"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition"
        >
          <Code2 class="w-3.5 h-3.5" />
          <span>Generate SQL</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </router-link>
      </div>
    </div>

    <!-- ERD Canvas -->
    <ErdCanvas />

    <!-- Relationship Summary Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      <div class="flex items-center gap-2">
        <Link2 class="w-4 h-4 text-cyan-400" />
        <h2 class="text-sm font-bold text-white">Daftar Relasi Foreign Key</h2>
        <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
          {{ schemaStore.relations.length }} relasi
        </span>
      </div>

      <div v-if="schemaStore.relations.length === 0" class="text-xs text-slate-500 italic py-4">
        Tidak ada relasi foreign key yang terdeteksi (semua tabel bersifat independen atau flat).
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs text-left text-slate-300 font-mono">
          <thead class="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
            <tr>
              <th class="px-4 py-2.5">Tabel Asal (Child)</th>
              <th class="px-4 py-2.5">Kolom FK</th>
              <th class="px-4 py-2.5 text-center">Arah</th>
              <th class="px-4 py-2.5">Tabel Target (Parent)</th>
              <th class="px-4 py-2.5">Kolom Target (PK)</th>
              <th class="px-4 py-2.5">On Delete</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-950/40">
            <tr v-for="rel in schemaStore.relations" :key="rel.id" class="hover:bg-slate-800/40">
              <td class="px-4 py-2 font-bold text-indigo-300">{{ rel.fromTable }}</td>
              <td class="px-4 py-2 text-cyan-300">{{ rel.fromColumn }}</td>
              <td class="px-4 py-2 text-center text-slate-500">➔</td>
              <td class="px-4 py-2 font-bold text-purple-300">{{ rel.toTable }}</td>
              <td class="px-4 py-2 text-amber-300">{{ rel.toColumn }}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                  {{ rel.onDelete }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
