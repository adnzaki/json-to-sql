import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for full offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, ready to refresh');
  },
  onOfflineReady() {
    console.log('SchemaCraft is ready to work offline');
  },
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
