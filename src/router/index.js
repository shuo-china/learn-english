import { createRouter, createWebHistory } from 'vue-router'
import ReadingPage from '../views/ReadingPage.vue'
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
    {
      path: '/reading',
      name: 'reading',
      component: ReadingPage,
    },
  ],
})

export default router
