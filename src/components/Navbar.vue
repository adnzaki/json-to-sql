<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useSchemaStore } from '../stores/schemaStore';
import PWAInstallButton from './PWAInstallButton.vue';
import {
  Database,
  GitBranch,
  Code2,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-vue-next';

const route = useRoute();
const schemaStore = useSchemaStore();

const navItems = [
  { name: 'Studio & Review', path: '/', icon: Layers },
  { name: 'Visual ERD', path: '/erd', icon: GitBranch },
  { name: 'SQL & Export', path: '/sql', icon: Code2 },
  { name: 'Panduan Desain', path: '/guide', icon: BookOpen },
];
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
      <!-- Brand -->
      <div class="flex items-center gap-3">
        <router-link to="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Database class="w-4.5 h-4.5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SchemaCraft
              </span>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PWA
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-medium hidden sm:block">JSON to MySQL & PostgreSQL Builder</p>
          </div>
        </router-link>

        <!-- Dialect Switcher in Header -->
        <div class="hidden md:flex items-center gap-1 ml-4 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            @click="schemaStore.setDialect('mysql')"
            :class="[
              'px-2.5 py-1 rounded-md font-semibold transition cursor-pointer',
              schemaStore.sqlOptions.dialect === 'mysql'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            MySQL
          </button>
          <button
            @click="schemaStore.setDialect('postgres')"
            :class="[
              'px-2.5 py-1 rounded-md font-semibold transition cursor-pointer',
              schemaStore.sqlOptions.dialect === 'postgres'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            PostgreSQL
          </button>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex items-center gap-1 sm:gap-2">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
            route.path === item.path
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          ]"
        >
          <component :is="item.icon" class="w-3.5 h-3.5" />
          <span class="hidden md:inline">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Right Controls: Table Badge + PWA Install -->
      <div class="flex items-center gap-2.5">
        <div class="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <Sparkles class="w-3 h-3 text-emerald-400" />
          <span>{{ schemaStore.stats.tableCount }} Tabel</span>
          <span class="text-slate-600">•</span>
          <span>{{ schemaStore.stats.columnCount }} Kolom</span>
        </div>

        <PWAInstallButton />
      </div>
    </div>
  </header>
</template>
