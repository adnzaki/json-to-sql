<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSchemaStore } from '../stores/schemaStore';
import type { TableDefinition } from '../types/schema';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Key,
  Link2,
  Table as TableIcon,
  Search,
  Move,
  Layers,
  Sparkles,
} from 'lucide-vue-next';

const schemaStore = useSchemaStore();

// Canvas pan & zoom state
const zoom = ref(1);
const pan = ref({ x: 40, y: 40 });
const isPanning = ref(false);
const startPan = ref({ x: 0, y: 0 });
const searchQuery = ref('');

// Dragging a specific table
const draggingTableId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

const canvasRef = ref<HTMLDivElement | null>(null);

const filteredTables = computed(() => {
  if (!searchQuery.value.trim()) return schemaStore.tables;
  const q = searchQuery.value.toLowerCase();
  return schemaStore.tables.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.columns.some((c) => c.name.toLowerCase().includes(q))
  );
});

// Calculate Bezier curves for foreign key relations
const svgCurves = computed(() => {
  const curves: {
    id: string;
    d: string;
    label: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  }[] = [];

  schemaStore.relations.forEach((rel) => {
    const fromTable = schemaStore.tables.find((t) => t.name === rel.fromTable);
    const toTable = schemaStore.tables.find((t) => t.name === rel.toTable);

    if (fromTable?.position && toTable?.position) {
      // Find column vertical offset approx
      const fromColIdx = Math.max(0, fromTable.columns.findIndex((c) => c.name === rel.fromColumn));
      const toColIdx = Math.max(0, toTable.columns.findIndex((c) => c.name === rel.toColumn));

      const cardWidth = 280;
      const headerHeight = 44;
      const rowHeight = 28;

      // From (Child table FK)
      const startX = fromTable.position.x + (fromTable.position.x < toTable.position.x ? cardWidth : 0);
      const startY = fromTable.position.y + headerHeight + fromColIdx * rowHeight + 14;

      // To (Parent table PK)
      const endX = toTable.position.x + (fromTable.position.x < toTable.position.x ? 0 : cardWidth);
      const endY = toTable.position.y + headerHeight + toColIdx * rowHeight + 14;

      const deltaX = Math.abs(endX - startX) * 0.5;
      const control1X = startX + (fromTable.position.x < toTable.position.x ? deltaX : -deltaX);
      const control1Y = startY;
      const control2X = endX + (fromTable.position.x < toTable.position.x ? -deltaX : deltaX);
      const control2Y = endY;

      const path = `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;

      curves.push({
        id: rel.id,
        d: path,
        label: `${rel.fromTable}.${rel.fromColumn} ➔ ${rel.toTable}.${rel.toColumn}`,
        fromX: startX,
        fromY: startY,
        toX: endX,
        toY: endY,
      });
    }
  });

  return curves;
});

// Canvas Interaction Handlers
const handleMouseDown = (e: MouseEvent) => {
  // Check if clicked directly on canvas background
  if ((e.target as HTMLElement).classList.contains('canvas-bg')) {
    isPanning.value = true;
    startPan.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
  }
};

const handleMouseMove = (e: MouseEvent) => {
  if (isPanning.value) {
    pan.value = {
      x: e.clientX - startPan.value.x,
      y: e.clientY - startPan.value.y,
    };
  } else if (draggingTableId.value) {
    const table = schemaStore.tables.find((t) => t.id === draggingTableId.value);
    if (table) {
      const newX = Math.round((e.clientX - pan.value.x) / zoom.value - dragOffset.value.x);
      const newY = Math.round((e.clientY - pan.value.y) / zoom.value - dragOffset.value.y);
      schemaStore.updatePosition(draggingTableId.value, Math.max(10, newX), Math.max(10, newY));
    }
  }
};

const handleMouseUp = () => {
  isPanning.value = false;
  draggingTableId.value = null;
};

const startDragTable = (e: MouseEvent, table: TableDefinition) => {
  e.stopPropagation();
  draggingTableId.value = table.id;
  schemaStore.activeTableId = table.id;

  const currentPos = table.position || { x: 50, y: 50 };
  const mouseCanvasX = (e.clientX - pan.value.x) / zoom.value;
  const mouseCanvasY = (e.clientY - pan.value.y) / zoom.value;

  dragOffset.value = {
    x: mouseCanvasX - currentPos.x,
    y: mouseCanvasY - currentPos.y,
  };
};

const zoomIn = () => {
  zoom.value = Math.min(1.8, zoom.value + 0.15);
};

const zoomOut = () => {
  zoom.value = Math.max(0.4, zoom.value - 0.15);
};

const resetView = () => {
  zoom.value = 1;
  pan.value = { x: 40, y: 40 };
};

const autoLayout = () => {
  const cols = Math.ceil(Math.sqrt(schemaStore.tables.length));
  const spacingX = 350;
  const spacingY = 320;

  schemaStore.tables.forEach((t, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    schemaStore.updatePosition(t.id, 60 + col * spacingX, 60 + row * spacingY);
  });
  resetView();
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="relative w-full h-[750px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden select-none shadow-2xl">
    <!-- Grid Dots Background -->
    <div
      ref="canvasRef"
      @mousedown="handleMouseDown"
      class="canvas-bg absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]"
    >
      <!-- Zoom/Pan Container -->
      <div
        class="absolute origin-top-left transition-transform duration-75 pointer-events-none"
        :style="{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '4000px',
          height: '4000px',
        }"
      >
        <!-- SVG Connections Layer -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
            </marker>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g v-for="curve in svgCurves" :key="curve.id">
            <!-- Glow background line -->
            <path
              :d="curve.d"
              stroke="#0284c7"
              stroke-width="5"
              stroke-opacity="0.25"
              fill="none"
              filter="url(#lineGlow)"
            />
            <!-- Main visible line with animated dash -->
            <path
              :d="curve.d"
              stroke="#38bdf8"
              stroke-width="2"
              fill="none"
              stroke-dasharray="6,4"
              class="animate-[dash_20s_linear_infinite]"
              marker-end="url(#arrowhead)"
            />
            <!-- Circle nodes on ends -->
            <circle :cx="curve.fromX" :cy="curve.fromY" r="4" fill="#38bdf8" />
            <circle :cx="curve.toX" :cy="curve.toY" r="4" fill="#a855f7" />
          </g>
        </svg>

        <!-- Interactive Table Cards -->
        <div
          v-for="table in filteredTables"
          :key="table.id"
          @mousedown="(e) => startDragTable(e, table)"
          :style="{
            transform: `translate(${table.position?.x || 50}px, ${table.position?.y || 50}px)`,
          }"
          :class="[
            'pointer-events-auto absolute w-[280px] rounded-xl border shadow-xl backdrop-blur-md transition-shadow cursor-move z-20',
            schemaStore.activeTableId === table.id
              ? 'bg-slate-900/95 border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-black/50'
          ]"
        >
          <!-- Table Header -->
          <div class="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60 rounded-t-xl border-b border-slate-800">
            <div class="flex items-center gap-2 truncate">
              <TableIcon class="w-4 h-4 text-indigo-400 shrink-0" />
              <span class="font-bold text-xs text-white truncate font-mono">{{ table.name }}</span>
            </div>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
              {{ table.columns.length }} cols
            </span>
          </div>

          <!-- Column List -->
          <div class="p-2 space-y-1 max-h-[280px] overflow-y-auto">
            <div
              v-for="col in table.columns"
              :key="col.id"
              class="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800/60 transition text-xs font-mono"
            >
              <div class="flex items-center gap-1.5 truncate">
                <Key v-if="col.isPrimaryKey" class="w-3 h-3 text-amber-400 shrink-0" />
                <Link2 v-else-if="col.foreignKey" class="w-3 h-3 text-cyan-400 shrink-0" />
                <span class="w-3 shrink-0" v-else></span>

                <span
                  :class="[
                    'truncate',
                    col.isPrimaryKey ? 'text-amber-200 font-bold' : col.foreignKey ? 'text-cyan-200 font-semibold' : 'text-slate-300'
                  ]"
                >
                  {{ col.name }}
                </span>
              </div>

              <div class="flex items-center gap-1 shrink-0 text-[10px] text-slate-400">
                <span class="px-1 py-0.2 bg-slate-800/80 rounded text-slate-300">
                  {{ col.dataType }}{{ col.lengthOrPrecision ? `(${col.lengthOrPrecision})` : '' }}
                </span>
                <span v-if="!col.isNullable && !col.isPrimaryKey" class="text-rose-400 text-[9px] font-bold" title="NOT NULL">*</span>
              </div>
            </div>
          </div>

          <!-- Table Footer Info -->
          <div v-if="table.rows && table.rows.length > 0" class="px-3 py-1.5 bg-slate-950/60 rounded-b-xl border-t border-slate-800/60 text-[10px] text-slate-500 flex justify-between items-center">
            <span>{{ table.rows.length }} sample records</span>
            <span v-if="schemaStore.activeTableId === table.id" class="text-indigo-400 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Top Toolbar -->
    <div class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
      <!-- Search & Filters -->
      <div class="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <div class="relative flex items-center">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari tabel atau kolom..."
            class="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
          />
        </div>
        <button
          @click="autoLayout"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          title="Tata letak otomatis susunan tabel"
        >
          <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
          <span class="hidden sm:inline">Auto-Layout</span>
        </button>
      </div>

      <!-- Zoom & Canvas Controls -->
      <div class="flex items-center gap-1 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          @click="zoomIn"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn class="w-4 h-4" />
        </button>
        <span class="text-[11px] font-mono text-slate-300 px-1">{{ Math.round(zoom * 100) }}%</span>
        <button
          @click="zoomOut"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
        <div class="w-px h-4 bg-slate-800 mx-1"></div>
        <button
          @click="resetView"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Reset Posisi (100%)"
        >
          <Maximize2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Floating Bottom Legend -->
    <div class="absolute bottom-4 left-4 pointer-events-auto z-30 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-400 shadow-xl">
      <div class="flex items-center gap-1.5">
        <Key class="w-3 h-3 text-amber-400" />
        <span>Primary Key (PK)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Link2 class="w-3 h-3 text-cyan-400" />
        <span>Foreign Key (FK)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>{{ schemaStore.relations.length }} Relasi Aktif</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}
</style>
