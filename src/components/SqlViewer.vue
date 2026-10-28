<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSchemaStore } from '../stores/schemaStore';
import {
  Download,
  Copy,
  Check,
  FileCode2,
  FileText,
  Boxes,
  Database,
  Layers,
  Sparkles,
} from 'lucide-vue-next';

const schemaStore = useSchemaStore();

const activeTab = ref<'sql' | 'dbml' | 'prisma' | 'ts'>('sql');
const isCopied = ref(false);

const currentCode = computed(() => {
  switch (activeTab.value) {
    case 'sql':
      return schemaStore.generatedSql;
    case 'dbml':
      return schemaStore.dbmlCode;
    case 'prisma':
      return schemaStore.prismaCode;
    case 'ts':
      return schemaStore.tsInterfacesCode;
    default:
      return schemaStore.generatedSql;
  }
});

const codeLines = computed(() => {
  return currentCode.value.split('\n');
});

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(currentCode.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

const handleDownload = () => {
  let filename = 'schema.sql';
  let mimeType = 'text/plain';

  if (activeTab.value === 'sql') {
    filename = `${schemaStore.sqlOptions.databaseName || 'schema'}_${schemaStore.sqlOptions.dialect}.sql`;
  } else if (activeTab.value === 'dbml') {
    filename = 'schema.dbml';
  } else if (activeTab.value === 'prisma') {
    filename = 'schema.prisma';
  } else if (activeTab.value === 'ts') {
    filename = 'database-models.d.ts';
  }

  const blob = new Blob([currentCode.value], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full text-slate-100">
    <!-- Toolbar -->
    <div class="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <!-- Tabs (SQL, DBML, Prisma, TS) -->
      <div class="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          @click="activeTab = 'sql'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer',
            activeTab === 'sql'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <Database class="w-3.5 h-3.5" />
          <span>SQL ({{ schemaStore.sqlOptions.dialect.toUpperCase() }})</span>
        </button>

        <button
          @click="activeTab = 'dbml'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer',
            activeTab === 'dbml'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <FileText class="w-3.5 h-3.5" />
          <span>DBML</span>
        </button>

        <button
          @click="activeTab = 'prisma'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer',
            activeTab === 'prisma'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <Boxes class="w-3.5 h-3.5" />
          <span>Prisma</span>
        </button>

        <button
          @click="activeTab = 'ts'"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer',
            activeTab === 'ts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          <FileCode2 class="w-3.5 h-3.5" />
          <span>TypeScript</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Include Data Toggle Pill (When on SQL tab) -->
        <label
          v-if="activeTab === 'sql'"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-slate-700 transition"
          title="Sertakan atau sembunyikan query INSERT data"
        >
          <input
            type="checkbox"
            v-model="schemaStore.sqlOptions.includeData"
            class="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <span class="text-slate-300 font-medium">Sertakan Data</span>
        </label>

        <!-- Copy Button -->
        <button
          @click="handleCopy"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700/60"
        >
          <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ isCopied ? 'Tersalin!' : 'Salin Kode' }}</span>
        </button>

        <!-- Download Button -->
        <button
          @click="handleDownload"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Unduh File</span>
        </button>
      </div>
    </div>

    <!-- Code View with Line Numbers -->
    <div class="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed">
      <div class="min-w-full inline-block">
        <div
          v-for="(line, idx) in codeLines"
          :key="idx"
          class="table-row hover:bg-slate-900/60 transition group"
        >
          <!-- Line number -->
          <span class="table-cell text-right pr-4 text-slate-600 select-none w-10 group-hover:text-slate-400 font-sans text-[11px]">
            {{ idx + 1 }}
          </span>

          <!-- Line content with simple color classification -->
          <span
            :class="[
              'table-cell whitespace-pre',
              line.trim().startsWith('--') || line.trim().startsWith('//')
                ? 'text-emerald-500/90 italic font-sans'
                : line.includes('CREATE TABLE') || line.includes('PRIMARY KEY') || line.includes('FOREIGN KEY') || line.includes('CONSTRAINT')
                ? 'text-indigo-300 font-semibold'
                : line.includes('INSERT INTO')
                ? 'text-amber-300'
                : 'text-slate-300'
            ]"
          >{{ line }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
