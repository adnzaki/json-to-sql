import { createRouter, createWebHistory } from 'vue-router';
import StudioView from '../views/StudioView.vue';
import ErdView from '../views/ErdView.vue';
import SqlView from '../views/SqlView.vue';
import GuideView from '../views/GuideView.vue';

const routes = [
  {
    path: '/',
    name: 'studio',
    component: StudioView,
  },
  {
    path: '/erd',
    name: 'erd',
    component: ErdView,
  },
  {
    path: '/sql',
    name: 'sql',
    component: SqlView,
  },
  {
    path: '/guide',
    name: 'guide',
    component: GuideView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
