import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ExercisesView from '@/views/ExerciseView.vue'
import CreateExercise from '@/views/CreateView.vue'
import TutorialView from '@/views/TutorialView.vue'

const isLogged = () => !!localStorage.getItem('token')

const routes = [
  {
    path: '/',
    children: [
      { path: '', redirect: '/login' },
      { path: 'login', component: LoginView },
      { path: 'register', component: RegisterView }
    ],
    beforeEnter: () => !isLogged()
  },

  {
    path: '/app',
    children: [
      { path: '', redirect: '/app/exercises' },
      { path: 'exercises', component: ExercisesView },
      { path: 'create', component: CreateExercise },
      { path: 'tutorial', component: TutorialView }
    ],
    beforeEnter: () => isLogged()
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
