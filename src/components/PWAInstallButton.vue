<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Download, Share2, Smartphone } from 'lucide-vue-next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstalled = ref(false);
const isIOS = ref(false);
const showIOSGuide = ref(false);

const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault();
  deferredPrompt.value = e as BeforeInstallPromptEvent;
};

const handleAppInstalled = () => {
  isInstalled.value = true;
  deferredPrompt.value = null;
};

onMounted(() => {
  // Check standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  isInstalled.value = isStandalone;

  // Detect iOS
  const userAgent = window.navigator.userAgent.toLowerCase();
  isIOS.value = /iphone|ipad|ipod/.test(userAgent);

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
});

const installApp = async () => {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') {
    isInstalled.value = true;
    deferredPrompt.value = null;
  }
};
</script>

<template>
  <div v-if="!isInstalled">
    <!-- Chromium / Android / Desktop Install Button -->
    <button
      v-if="deferredPrompt"
      @click="installApp"
      class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 transition cursor-pointer"
      title="Install SchemaCraft PWA"
    >
      <Download class="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>

    <!-- iOS Guide Trigger -->
    <button
      v-else-if="isIOS"
      @click="showIOSGuide = true"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
    >
      <Smartphone class="w-3.5 h-3.5 text-cyan-400" />
      <span>Install PWA</span>
    </button>

    <!-- iOS Guide Modal -->
    <div
      v-if="showIOSGuide"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Share2 class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-white">Install di iPhone / iPad</h3>
            <p class="text-xs text-slate-400">Jalankan offline layaknya aplikasi native</p>
          </div>
        </div>

        <ol class="space-y-3 text-xs text-slate-300 bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 mb-5">
          <li class="flex items-start gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold shrink-0">1</span>
            <span>Buka browser <strong>Safari</strong> dan tekan tombol <strong>Share</strong> (ikon kotak berpanah atas).</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold shrink-0">2</span>
            <span>Scroll ke bawah lalu pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold shrink-0">3</span>
            <span>Tekan <strong>Add</strong> di pojok kanan atas.</span>
          </li>
        </ol>

        <button
          @click="showIOSGuide = false"
          class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
        >
          Mengerti, Tutup
        </button>
      </div>
    </div>
  </div>
</template>
