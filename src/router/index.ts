import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/teams'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/auth/AuthPage.vue')
  },
  {
    path: '/tabs',
    component: () => import('../views/TabsPage.vue'),
    children: [
      
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
