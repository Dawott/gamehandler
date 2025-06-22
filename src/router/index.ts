import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import { auth } from '@/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

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
        path: 'my-teams',
        name: 'MyTeams',
        component: () => import('../views/teams/MyTeamsPage.vue')
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

router.beforeEach((to, from, next) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe() // Clean up the listener
    
    if (to.path === '/auth') {
      if (user) {
        next('/tabs/teams')
      } else {
        next()
      }
    } else {
      if (user) {
        next()
      } else {
        next('/auth')
      }
    }
  })
})

export default router