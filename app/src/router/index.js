import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useCredentials } from '@/stores/credentials'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ExercisesView from '@/views/ExerciseView.vue'
import CreateView from '@/views/CreateView.vue'
import TutorialView from '@/views/TutorialView.vue'
import SearchView from '@/views/SearchView.vue'

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
    }
  ],
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