<script setup>
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { loadBookArticle } from '../lib/articles'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  selectedBook: {
    type: Object,
    default: null,
  },
})

const article = ref(null)
const articleIndex = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
let requestId = 0

const articleFiles = computed(() => props.selectedBook?.article_files ?? [])
const articleCount = computed(() => articleFiles.value.length)
const progressLabel = computed(() =>
  articleCount.value ? `${articleIndex.value + 1} / ${articleCount.value}` : '',
)

async function loadCurrentArticle() {
  const currentRequestId = ++requestId
  article.value = null
  errorMessage.value = ''

  if (!articleCount.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    const loadedArticle = await loadBookArticle(props.selectedBook, articleIndex.value)

    if (currentRequestId === requestId) {
      article.value = loadedArticle
    }
  } catch (error) {
    if (currentRequestId === requestId) {
      errorMessage.value = error.message || '文章加载失败'
    }
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
    }
  }
}

function goToPreviousArticle() {
  if (articleIndex.value > 0) {
    articleIndex.value -= 1
  }
}

function goToNextArticle() {
  if (articleIndex.value < articleCount.value - 1) {
    articleIndex.value += 1
  }
}

watch(
  () => props.selectedBook?.folder,
  () => {
    articleIndex.value = 0
    loadCurrentArticle()
  },
  { immediate: true },
)

watch(articleIndex, loadCurrentArticle)
</script>

<template>
  <article class="reading-paper" aria-live="polite">
    <div v-if="isLoading" class="reading-state">正在翻开文章...</div>
    <div v-else-if="errorMessage" class="reading-state reading-error">{{ errorMessage }}</div>
    <div v-else-if="!articleCount" class="reading-state">该单词书暂无配套文章</div>

    <div v-else-if="article" class="reading-layout">
      <header class="reading-header">
        <h1>{{ article.title }}</h1>
      </header>

      <div class="reading-content">
        <section
          v-for="(paragraph, paragraphIndex) in article.paragraphs"
          :key="paragraphIndex"
          class="reading-paragraph"
        >
          <p class="reading-english">
            <template v-for="(part, partIndex) in paragraph.content" :key="partIndex">
              <span v-if="typeof part === 'string'">{{ part }}</span>
              <span v-else class="reading-term">
                <span class="reading-term-text">{{ part.text }}</span>
                <span class="reading-term-meaning">{{ part.meaning }}</span>
              </span>
            </template>
          </p>
          <p class="reading-translation">{{ paragraph.translation }}</p>
        </section>
      </div>

      <footer class="reading-navigation" aria-label="文章切换">
        <button
          class="reading-nav-button"
          type="button"
          :disabled="articleIndex === 0"
          @click="goToPreviousArticle"
        >
          <ChevronLeft aria-hidden="true" :size="20" :stroke-width="2" />
          <span>上一篇</span>
        </button>

        <span class="reading-progress">{{ progressLabel }}</span>

        <button
          class="reading-nav-button"
          type="button"
          :disabled="articleIndex >= articleCount - 1"
          @click="goToNextArticle"
        >
          <span>下一篇</span>
          <ChevronRight aria-hidden="true" :size="20" :stroke-width="2" />
        </button>
      </footer>
    </div>
  </article>
</template>
