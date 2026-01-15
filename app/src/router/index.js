import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useCredentials } from '@/stores/credentials'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ExercisesView from '@/views/ExerciseView.vue'
import CreateView from '@/views/CreateView.vue'
import TutorialView from '@/views/TutorialView.vue'
import SearchView from '@/views/SearchView.vue'
import UserView from '@/views/UserView.vue'
import FavoriteView from '@/views/FavoriteView.vue'

const router = createRouter({
  history: import.meta.env.PROD ? createWebHistory() : createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        noAuth: true,
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        noAuth: true,
      }
    },
    {
      path: '/create',
      name: 'create',
      component: CreateView,
      meta: {
        noAuth: false,
      }
    },
    {
      path: '/exercise/:id',
      name: 'exercise',
      component: ExercisesView,
      meta: {
        noAuth: false,
      }
    },
    {
      path: '/user/:id',
      name: 'user',
      component: UserView,
      meta: {
        noAuth: false,
      }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoriteView,
      meta: {
        noAuth: false,
      }
    },
    {
      path: '/tutorial',
      name: 'tutorial',
      component: TutorialView,
      meta: {
        noAuth: false,
      }
    },
  ],
scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      const el = document.querySelector(to.hash)
      if (el) {
        const HEADER_OFFSET = 120
        const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
        return window.scrollTo({ top, behavior: 'smooth' })
      }
    }
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const credentials = useCredentials();
  if (!to.matched.some(record => record.meta.noAuth) && !credentials.isAuthenticated) {
    next({ name: "login" });
  } else {
    next();
  }
})

export default router;