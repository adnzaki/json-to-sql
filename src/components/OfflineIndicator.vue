<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { WifiOff } from 'lucide-vue-next';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<template>
  <div
    v-if="!isOnline"
    class="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-slate-950 shadow-xl border border-amber-400"
  >
    <WifiOff class="w-4 h-4 animate-bounce text-slate-950" />
    <span><strong>Mode Offline:</strong> SchemaCraft tetap bekerja penuh via PWA local worker.</span>
  </div>
</template>
