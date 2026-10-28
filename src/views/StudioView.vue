<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSchemaStore } from '../stores/schemaStore';
import { samplePresets } from '../presets/sampleData';
import OptimizationSettings from '../components/OptimizationSettings.vue';
import TableEditorModal from '../components/TableEditorModal.vue';
import {
  Code2,
  UploadCloud,
  FileJson,
  Sparkles,
  ArrowRight,
  Eye,
  Edit3,
  Trash2,
  Plus,
  AlertTriangle,
  Key,
  Link2,
  Sliders,
  CheckCircle2,
  Table as TableIcon,
  Layers,
} from 'lucide-vue-next';

const router = useRouter();
const schemaStore = useSchemaStore();

const showSettings = ref(true);
const editingTableId = ref<string | null>(null);
const isModalOpen = ref(false);
const previewDataTab = ref<string | null>(null);

const fileInputRef = ref<HTMLInputElement | null>(null);

const openTableEditor = (tableId: string) => {
  editingTableId.value = tableId;
  isModalOpen.value = true;
};

const handleAddNewTable = () => {
  const newTableId = crypto.randomUUID();
  schemaStore.addTable({
    id: newTableId,
    name: `new_table_${schemaStore.tables.length + 1}`,
    columns: [
      {
        id: crypto.randomUUID(),
        name: 'id',
        dataType: 'BIGINT',
        isNullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        isUnique: true,
        isIndex: true,
      },
      {
        id: crypto.randomUUID(),
        name: 'title',
        dataType: 'VARCHAR',
        lengthOrPrecision: '255',
        isNullable: false,
        isPrimaryKey: false,
        isAutoIncrement: false,
        isUnique: false,
        isIndex: false,
      },
    ],
    rows: [],
    position: { x: 100, y: 100 },
  });
  openTableEditor(newTableId);
};

const handleJsonInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  schemaStore.setJson(target.value);
};

const handleFormatJson = () => {
  try {
    const parsed = JSON.parse(schemaStore.rawJsonText);
    schemaStore.setJson(JSON.stringify(parsed, null, 2));
  } catch (err: any) {
    schemaStore.parseError = 'Gagal merapikan JSON: format tidak valid';
  }
};

const triggerFileUpload = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    schemaStore.setJson(text);
  };
  reader.readAsText(file);
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <!-- Top Hero Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
      <div class="relative z-10 max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
          <span>Intelligent Schema Inference & Normalizer</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          Konversi JSON ke Struktur Tabel <span class="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">MySQL & PostgreSQL</span>
        </h1>
        <p class="text-sm text-slate-300 mt-2 leading-relaxed">
          Ubah data mentah JSON menjadi skema database relasional berkualitas tinggi. Normalisasi 1NF & 3NF otomatis, deteksi tipe presisi, review visual sebelum ekspor SQL.
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="relative z-10 flex flex-wrap items-center gap-3 mt-5">
        <button
          @click="showSettings = !showSettings"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer',
            showSettings
              ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          ]"
        >
          <Sliders class="w-3.5 h-3.5 text-indigo-400" />
          <span>{{ showSettings ? 'Sembunyikan Pengaturan' : 'Aturan Optimasi & Normalisasi' }}</span>
        </button>

        <router-link
          to="/erd"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <Eye class="w-3.5 h-3.5 text-cyan-400" />
          <span>Lihat Visual ERD</span>
        </router-link>

        <router-link
          to="/sql"
          class="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition ml-auto"
        >
          <span>Generate SQL Script</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>
    </div>

    <!-- Optimization Panel (Collapsible) -->
    <div v-show="showSettings" class="transition-all duration-200">
      <OptimizationSettings />
    </div>

    <!-- Main Workspace Split: JSON Input (Left) & Table Review (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- LEFT: JSON Input & Presets (5 Cols) -->
      <div class="lg:col-span-5 space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
          <!-- Header & Presets -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <FileJson class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold uppercase tracking-wider text-slate-300">Input Data JSON</span>
            </div>

            <!-- Presets Dropdown -->
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] text-slate-400">Contoh:</span>
              <select
                @change="(e) => schemaStore.loadPreset((e.target as HTMLSelectElement).value)"
                class="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option v-for="p in samplePresets" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Root Table Name specifier -->
          <div class="py-2.5 flex items-center gap-2">
            <span class="text-[11px] text-slate-400 font-medium">Tabel Utama:</span>
            <input
              type="text"
              v-model="schemaStore.rootTableName"
              @change="schemaStore.runConversion"
              placeholder="orders"
              class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono w-36 focus:outline-none focus:border-indigo-500"
            />
            <span class="text-[10px] text-slate-500 italic">(akar nama entitas)</span>
          </div>

          <!-- JSON Error Warning -->
          <div
            v-if="schemaStore.parseError"
            class="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
          >
            <AlertTriangle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div class="flex-1 font-mono text-[11px]">
              {{ schemaStore.parseError }}
            </div>
          </div>

          <!-- Codearea -->
          <div class="relative flex-1 min-h-[380px] bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-hidden flex flex-col">
            <textarea
              :value="schemaStore.rawJsonText"
              @input="handleJsonInput"
              placeholder="Paste JSON kamu di sini..."
              class="w-full flex-1 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- Action bar under JSON -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-xs">
            <div class="flex items-center gap-2">
              <input
                ref="fileInputRef"
                type="file"
                accept=".json,application/json"
                @change="handleFileUpload"
                class="hidden"
              />
              <button
                @click="triggerFileUpload"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Unggah file .json dari komputermu"
              >
                <UploadCloud class="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload .JSON</span>
              </button>

              <button
                @click="handleFormatJson"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Format & Rapikan indentasi JSON"
              >
                <Code2 class="w-3.5 h-3.5 text-indigo-400" />
                <span>Rapikan</span>
              </button>
            </div>

            <button
              @click="schemaStore.runConversion"
              class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer shadow-sm"
            >
              Parse Ulang
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Table Review & Schema Inspector (7 Cols) -->
      <div class="lg:col-span-7 space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
          <!-- Section Title -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-indigo-400" />
              <div>
                <h2 class="text-sm font-bold text-white">Review Struktur Tabel Hasil Konversi</h2>
                <p class="text-[11px] text-slate-400">Tinjau, sesuaikan kolom & relasi sebelum membuat skrip SQL</p>
              </div>
            </div>

            <button
              @click="handleAddNewTable"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Tabel</span>
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-if="schemaStore.tables.length === 0"
            class="text-center py-16 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs"
          >
            Masukkan JSON di sebelah kiri untuk menghasilkan struktur tabel.
          </div>

          <!-- Table Review Cards List -->
          <div v-else class="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            <div
              v-for="table in schemaStore.tables"
              :key="table.id"
              class="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition shadow-md"
            >
              <!-- Card Header -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                    <TableIcon class="w-4 h-4" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-sm font-mono">{{ table.name }}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                        {{ table.columns.length }} kolom
                      </span>
                      <span v-if="table.rows.length > 0" class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                        {{ table.rows.length }} data baris
                      </span>
                    </div>
                    <p v-if="table.comment" class="text-[11px] text-slate-400 mt-0.5">{{ table.comment }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1.5">
                  <button
                    @click="previewDataTab = previewDataTab === table.id ? null : table.id"
                    :class="[
                      'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border',
                      previewDataTab === table.id
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    ]"
                    title="Lihat sampel baris data"
                  >
                    <Eye class="w-3.5 h-3.5 text-cyan-400" />
                    <span>Data</span>
                  </button>

                  <button
                    @click="openTableEditor(table.id)"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Edit nama tabel, tambah/hapus kolom, atur kunci"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                    <span>Edit Struktur</span>
                  </button>

                  <button
                    @click="schemaStore.deleteTable(table.id)"
                    class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Hapus tabel ini"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Columns Quick Chips -->
              <div class="py-3 flex flex-wrap gap-1.5">
                <div
                  v-for="col in table.columns"
                  :key="col.id"
                  :class="[
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border',
                    col.isPrimaryKey
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : col.foreignKey
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  ]"
                >
                  <Key v-if="col.isPrimaryKey" class="w-3 h-3 text-amber-400" />
                  <Link2 v-else-if="col.foreignKey" class="w-3 h-3 text-cyan-400" />

                  <span class="font-medium">{{ col.name }}</span>
                  <span class="text-[10px] text-slate-500">
                    {{ col.dataType }}{{ col.lengthOrPrecision ? `(${col.lengthOrPrecision})` : '' }}
                  </span>
                  <span v-if="!col.isNullable && !col.isPrimaryKey" class="text-[9px] text-rose-400 font-bold">*</span>
                </div>
              </div>

              <!-- Sample Data Preview Accordion -->
              <div v-if="previewDataTab === table.id" class="mt-2 pt-3 border-t border-slate-800">
                <div class="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Pratinjau Nilai Sampel ({{ table.rows.length }} baris)</span>
                </div>

                <div class="overflow-x-auto max-h-48 bg-slate-950 rounded-lg border border-slate-800">
                  <table class="w-full text-[11px] font-mono text-left text-slate-300 divide-y divide-slate-800">
                    <thead class="bg-slate-900 text-slate-400 text-[10px]">
                      <tr>
                        <th v-for="c in table.columns" :key="c.id" class="px-3 py-1.5 font-semibold">
                          {{ c.name }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-900">
                      <tr v-for="(row, rIdx) in table.rows.slice(0, 5)" :key="rIdx" class="hover:bg-slate-900/50">
                        <td v-for="c in table.columns" :key="c.id" class="px-3 py-1 truncate max-w-xs">
                          {{ row[c.name] !== undefined && row[c.name] !== null ? (typeof row[c.name] === 'object' ? JSON.stringify(row[c.name]) : String(row[c.name])) : 'NULL' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Summary & Proceed CTA -->
          <div class="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-400" />
              <span>Struktur siap diekspor menjadi skrip SQL</span>
            </div>

            <router-link
              to="/sql"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/30"
            >
              <span>Lanjut ke Generate SQL</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Editor Modal -->
    <TableEditorModal
      :table-id="editingTableId"
      :is-open="isModalOpen"
      @close="isModalOpen = false"
    />
  </div>
</template>
