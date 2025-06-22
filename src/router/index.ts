import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/teams'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/auth/AuthPage.vue')
  },
  {
    path: '/tabs/',
    component: () => import('@/views/TabsPage.vue'),
    children: [
      {
        path: '',
        redirect: '/tabs/teams'
      },
      {
        path: 'teams',
        name: 'Teams',
        component: () => import('../views/teams/TeamsPage.vue')
      },
      {
        path: 'profile',
        name: 'Profile', 
        component: () => import('../views/profile/ProfilePage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Simple auth guard (we'll enhance this later)
router.beforeEach(async (to) => {
  // Allow access to auth page
  if (to.path === '/auth') {
    return true
  }
  
  // For now, just redirect to auth if not authenticated
  // We'll add proper auth checking later
  const isAuthenticated = localStorage.getItem('firebase-auth-token')
  if (!isAuthenticated && to.path !== '/auth') {
    return '/auth'
  }
  
  return true
})

export default router