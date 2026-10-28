<script setup lang="ts">
import { onMounted } from 'vue';
import { useSchemaStore } from './stores/schemaStore';
import Navbar from './components/Navbar.vue';
import OfflineIndicator from './components/OfflineIndicator.vue';
import { Database, Heart, Sparkles, Layers, ShieldCheck } from 'lucide-vue-next';

const schemaStore = useSchemaStore();

onMounted(() => {
  schemaStore.init();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
    <!-- Top Navigation Bar -->
    <Navbar />

    <!-- Main Content Router View -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-900 bg-slate-950/90 py-8 px-4 text-xs text-slate-500">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-indigo-400" />
          <span class="font-bold text-slate-300">SchemaCraft PWA</span>
          <span>•</span>
          <span>JSON to MySQL & PostgreSQL Database Designer</span>
        </div>

        <div class="flex items-center gap-4 text-slate-400">
          <span class="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck class="w-3.5 h-3.5" />
            100% Client-Side Safe & Offline Capable
          </span>
          <span>•</span>
          <router-link to="/guide" class="hover:text-slate-200 transition">Dokumentasi</router-link>
        </div>
      </div>
    </footer>

    <!-- Offline Indicator Toast -->
    <OfflineIndicator />
  </div>
</template>
