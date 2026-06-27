import { createRouter, createWebHistory } from 'vue-router'
import ReviewPage from '../views/ReviewPage.vue'
import SpellingPage from '../views/SpellingPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'review',
      component: ReviewPage,
    },
    {
      path: '/spell',
      name: 'spell',
      component: SpellingPage,
    },
  ],
})

export default router
