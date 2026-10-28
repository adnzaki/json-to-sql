<script setup lang="ts">
import { computed } from 'vue';
import type { ColumnDataType, ColumnDefinition } from '../types/schema';
import { Key, Trash2, Hash, Type, Fingerprint } from 'lucide-vue-next';

const props = defineProps<{
  column: ColumnDefinition;
  isPostgres: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', updates: Partial<ColumnDefinition>): void;
  (e: 'delete'): void;
}>();

const availableTypes: ColumnDataType[] = [
  'INT',
  'BIGINT',
  'SMALLINT',
  'VARCHAR',
  'TEXT',
  'DECIMAL',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'JSON',
  'JSONB',
  'UUID',
];

const showsLength = computed(() => {
  return ['VARCHAR', 'CHAR', 'DECIMAL'].includes(props.column.dataType);
});

const onNameChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update', { name: target.value });
};

const onTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  emit('update', { dataType: target.value as ColumnDataType });
};

const onLengthChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update', { lengthOrPrecision: target.value });
};

const togglePk = () => {
  emit('update', {
    isPrimaryKey: !props.column.isPrimaryKey,
    isNullable: props.column.isPrimaryKey ? props.column.isNullable : false,
    isAutoIncrement: !props.column.isPrimaryKey && ['INT', 'BIGINT', 'SERIAL', 'BIGSERIAL'].includes(props.column.dataType),
  });
};

const toggleNullable = () => {
  if (props.column.isPrimaryKey) return;
  emit('update', { isNullable: !props.column.isNullable });
};

const toggleUnique = () => {
  emit('update', { isUnique: !props.column.isUnique });
};

const toggleIndex = () => {
  emit('update', { isIndex: !props.column.isIndex });
};
</script>

<template>
  <div class="grid grid-cols-12 gap-2 items-center py-2 px-3 hover:bg-slate-800/40 rounded-lg transition border border-transparent hover:border-slate-800 text-xs">
    <!-- Column Name -->
    <div class="col-span-12 sm:col-span-4 flex items-center gap-2">
      <div class="w-6 h-6 rounded flex items-center justify-center shrink-0" :class="column.isPrimaryKey ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'">
        <Key v-if="column.isPrimaryKey" class="w-3.5 h-3.5" />
        <Hash v-else-if="['INT', 'BIGINT', 'DECIMAL'].includes(column.dataType)" class="w-3.5 h-3.5" />
        <Type v-else class="w-3.5 h-3.5" />
      </div>
      <input
        type="text"
        :value="column.name"
        @input="onNameChange"
        placeholder="Nama kolom"
        class="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
      />
    </div>

    <!-- Data Type & Length -->
    <div class="col-span-6 sm:col-span-3 flex items-center gap-1.5">
      <select
        :value="column.dataType"
        @change="onTypeChange"
        class="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        <option v-for="t in availableTypes" :key="t" :value="t">{{ t }}</option>
      </select>

      <input
        v-if="showsLength"
        type="text"
        :value="column.lengthOrPrecision || ''"
        @input="onLengthChange"
        placeholder="255"
        title="Panjang atau Presisi"
        class="w-16 bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-slate-200 font-mono text-center text-xs focus:outline-none focus:border-indigo-500"
      />
    </div>

    <!-- Attributes / Flags -->
    <div class="col-span-5 sm:col-span-4 flex items-center gap-1.5 flex-wrap">
      <!-- PK -->
      <button
        @click="togglePk"
        type="button"
        title="Primary Key"
        :class="[
          'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition cursor-pointer',
          column.isPrimaryKey
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
            : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
        ]"
      >
        PK
      </button>

      <!-- NULLABLE -->
      <button
        @click="toggleNullable"
        type="button"
        :disabled="column.isPrimaryKey"
        title="Bisa bernilai NULL"
        :class="[
          'px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer',
          column.isNullable
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
        ]"
      >
        {{ column.isNullable ? 'NULL' : 'NOT NULL' }}
      </button>

      <!-- UNIQUE -->
      <button
        @click="toggleUnique"
        type="button"
        title="Nilai unik"
        :class="[
          'px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer',
          column.isUnique
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
        ]"
      >
        UNIQ
      </button>

      <!-- INDEX -->
      <button
        @click="toggleIndex"
        type="button"
        title="Tambahkan Index untuk performa query"
        :class="[
          'px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer',
          column.isIndex
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'
        ]"
      >
        IDX
      </button>

      <!-- FK Indicator -->
      <span
        v-if="column.foreignKey"
        :title="`Relasi ke ${column.foreignKey.targetTable}.${column.foreignKey.targetColumn}`"
        class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono"
      >
        <Fingerprint class="w-3 h-3" />
        FK
      </span>
    </div>

    <!-- Actions -->
    <div class="col-span-1 flex justify-end">
      <button
        @click="emit('delete')"
        title="Hapus Kolom"
        class="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
