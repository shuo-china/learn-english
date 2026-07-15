import { createRouter, createWebHistory } from 'vue-router'
import ReadingPage from '../views/ReadingPage.vue'
import RecitePage from '../views/RecitePage.vue'
import SpellingPage from '../views/SpellingPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/recite',
      name: 'recite',
      component: RecitePage,
    },
    {
      path: '/',
      redirect: { name: 'recite' },
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
