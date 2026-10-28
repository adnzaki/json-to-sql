<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSchemaStore } from '../stores/schemaStore';
import type { ColumnDefinition, TableDefinition, ForeignKeyRelation } from '../types/schema';
import ColumnEditorRow from './ColumnEditorRow.vue';
import {
  X,
  Plus,
  Table as TableIcon,
  Trash2,
  Save,
  Link2,
} from 'lucide-vue-next';

const props = defineProps<{
  tableId: string | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const schemaStore = useSchemaStore();

const table = computed(() => {
  return schemaStore.tables.find((t) => t.id === props.tableId);
});

const isPostgres = computed(() => schemaStore.sqlOptions.dialect === 'postgres');

// Form state
const tableName = ref('');
const tableComment = ref('');

// Sync table details when opened
const initModal = () => {
  if (table.value) {
    tableName.value = table.value.name;
    tableComment.value = table.value.comment || '';
  }
};

const handleSaveTableName = () => {
  if (!props.tableId || !tableName.value.trim()) return;
  schemaStore.updateTable(props.tableId, {
    name: tableName.value.trim(),
    comment: tableComment.value.trim(),
  });
};

const handleAddNewColumn = () => {
  if (!props.tableId) return;
  const newCol: ColumnDefinition = {
    id: crypto.randomUUID(),
    name: 'new_column',
    dataType: 'VARCHAR',
    lengthOrPrecision: '255',
    isNullable: true,
    isPrimaryKey: false,
    isAutoIncrement: false,
    isUnique: false,
    isIndex: false,
  };
  schemaStore.addColumn(props.tableId, newCol);
};

const handleDeleteColumn = (colId: string) => {
  if (!props.tableId) return;
  schemaStore.deleteColumn(props.tableId, colId);
};

const handleUpdateColumn = (colId: string, updates: Partial<ColumnDefinition>) => {
  if (!props.tableId) return;
  schemaStore.updateColumn(props.tableId, colId, updates);
};

const otherTables = computed(() => {
  return schemaStore.tables.filter((t) => t.id !== props.tableId);
});

// New Relation state
const selectedFromCol = ref('');
const selectedToTable = ref('');
const selectedToCol = ref('id');
const selectedOnDelete = ref<'CASCADE' | 'SET NULL' | 'RESTRICT'>('CASCADE');

const handleAddRelation = () => {
  if (!table.value || !selectedFromCol.value || !selectedToTable.value) return;

  const rel: ForeignKeyRelation = {
    id: crypto.randomUUID(),
    fromTable: table.value.name,
    fromColumn: selectedFromCol.value,
    toTable: selectedToTable.value,
    toColumn: selectedToCol.value,
    onDelete: selectedOnDelete.value,
    onUpdate: 'CASCADE',
  };

  schemaStore.relations.push(rel);

  // Update column foreignKey object
  const col = table.value.columns.find((c) => c.name === selectedFromCol.value);
  if (col) {
    col.foreignKey = {
      targetTable: selectedToTable.value,
      targetColumn: selectedToCol.value,
      onDelete: selectedOnDelete.value,
    };
    col.isIndex = true;
  }

  // Reset form
  selectedFromCol.value = '';
  selectedToTable.value = '';
};

const tableRelations = computed(() => {
  if (!table.value) return [];
  return schemaStore.relations.filter((r) => r.fromTable === table.value?.name);
});

const removeRelation = (relId: string) => {
  schemaStore.relations = schemaStore.relations.filter((r) => r.id !== relId);
};
</script>

<template>
  <div
    v-if="isOpen && table"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
  >
    <div class="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 bg-slate-800/60 border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <TableIcon class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span>Editor Struktur Tabel:</span>
              <span class="font-mono text-cyan-400">{{ table.name }}</span>
            </h2>
            <p class="text-xs text-slate-400">Atur kolom, tipe data, kunci primer, dan relasi foreign key</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        <!-- Table Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Tabel</label>
            <input
              type="text"
              v-model="table.name"
              placeholder="users"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Deskripsi / Komentar Tabel</label>
            <input
              type="text"
              v-model="table.comment"
              placeholder="Menyimpan profil pengguna..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Columns Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Kolom ({{ table.columns.length }})
            </h3>
            <button
              @click="handleAddNewColumn"
              class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Kolom Baru</span>
            </button>
          </div>

          <!-- Column Table Header -->
          <div class="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 px-3 py-1.5 bg-slate-950/80 rounded-t-lg border border-slate-800">
            <div class="col-span-4">NAMA KOLOM</div>
            <div class="col-span-3">TIPE DATA & PANJANG</div>
            <div class="col-span-4">ATRIBUT & KUNCI</div>
            <div class="col-span-1 text-right">AKSI</div>
          </div>

          <!-- Column Rows -->
          <div class="bg-slate-950/40 border border-t-0 border-slate-800 rounded-b-lg divide-y divide-slate-800/50 p-1">
            <ColumnEditorRow
              v-for="col in table.columns"
              :key="col.id"
              :column="col"
              :is-postgres="isPostgres"
              @update="(updates) => handleUpdateColumn(col.id, updates)"
              @delete="() => handleDeleteColumn(col.id)"
            />
          </div>
        </div>

        <!-- Foreign Key Relations Section -->
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-2">
            <Link2 class="w-4 h-4 text-cyan-400" />
            <h3 class="text-xs font-bold text-white">Relasi Foreign Key (Tabel Ini ➔ Tabel Target)</h3>
          </div>

          <!-- Existing Relations -->
          <div v-if="tableRelations.length > 0" class="space-y-2">
            <div
              v-for="rel in tableRelations"
              :key="rel.id"
              class="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs"
            >
              <div class="flex items-center gap-2 font-mono">
                <span class="text-indigo-300 font-semibold">{{ rel.fromColumn }}</span>
                <span class="text-slate-500">➔</span>
                <span class="text-cyan-300 font-semibold">{{ rel.toTable }}.{{ rel.toColumn }}</span>
                <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                  ON DELETE {{ rel.onDelete }}
                </span>
              </div>
              <button
                @click="removeRelation(rel.id)"
                class="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                title="Hapus relasi ini"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div v-else class="text-xs text-slate-500 italic">
            Belum ada relasi keluar untuk tabel ini.
          </div>

          <!-- Add Relation Sub-form -->
          <div v-if="otherTables.length > 0" class="pt-3 border-t border-slate-800/80">
            <div class="text-[11px] font-semibold text-slate-400 mb-2">Tambahkan Relasi Baru:</div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Dari Kolom</label>
                <select
                  v-model="selectedFromCol"
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                >
                  <option value="">Pilih Kolom...</option>
                  <option v-for="c in table.columns" :key="c.id" :value="c.name">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Ke Tabel</label>
                <select
                  v-model="selectedToTable"
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                >
                  <option value="">Pilih Tabel Target...</option>
                  <option v-for="ot in otherTables" :key="ot.id" :value="ot.name">{{ ot.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">On Delete</label>
                <select
                  v-model="selectedOnDelete"
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                >
                  <option value="CASCADE">CASCADE</option>
                  <option value="SET NULL">SET NULL</option>
                  <option value="RESTRICT">RESTRICT</option>
                </select>
              </div>

              <div class="flex items-end">
                <button
                  @click="handleAddRelation"
                  :disabled="!selectedFromCol || !selectedToTable"
                  class="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Hubungkan FK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 bg-slate-800/40 border-t border-slate-800 flex justify-between items-center shrink-0">
        <button
          @click="() => { schemaStore.deleteTable(table.id); emit('close'); }"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Hapus Tabel Ini</span>
        </button>

        <button
          @click="emit('close')"
          class="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Save class="w-3.5 h-3.5" />
          <span>Selesai & Tutup</span>
        </button>
      </div>
    </div>
  </div>
</template>
