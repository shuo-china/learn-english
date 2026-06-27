<script setup>
import { BookOpen, ChevronDown } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { playPronunciation } from './lib/pronunciation'
import { createShuffledWordIds, loadBooksIndex, loadVocabularyWords } from './lib/vocabulary'

const books = ref([])
const selectedBookId = ref('')
const words = ref([])
const orderMode = ref('shuffle')
const shuffledIds = ref([])
const isBookMenuOpen = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

const selectedBook = computed(() =>
  books.value.find((book) => book.id === selectedBookId.value),
)

const visibleWords = computed(() => {
  if (orderMode.value !== 'shuffle') {
    return words.value
  }

  const byId = new Map(words.value.map((word) => [word.id, word]))
  return shuffledIds.value.map((id) => byId.get(id)).filter(Boolean)
})

function shuffleWordIds(items) {
  shuffledIds.value = createShuffledWordIds(items)
}

async function loadBooks() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    books.value = await loadBooksIndex()
    selectedBookId.value = books.value[0]?.id ?? ''
  } catch (error) {
    errorMessage.value = error.message || '单词本加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadSelectedBook() {
  if (!selectedBook.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  isBookMenuOpen.value = false

  try {
    words.value = await loadVocabularyWords(selectedBook.value)
    shuffleWordIds(words.value)
  } catch (error) {
    words.value = []
    errorMessage.value = error.message || '单词本加载失败'
  } finally {
    isLoading.value = false
  }
}

function selectBook(bookId) {
  selectedBookId.value = bookId
  isBookMenuOpen.value = false
}

function setOrderMode(mode) {
  orderMode.value = mode

  if (mode === 'shuffle') {
    shuffleWordIds(words.value)
  }
}

function handleWordClick(wordId) {
  const word = words.value.find((item) => item.id === wordId)

  if (word) {
    word.revealed = !word.revealed

    if (word.revealed) {
      playPronunciation(word.word)
    }
  }
}

watch(selectedBookId, loadSelectedBook)

onMounted(loadBooks)
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div class="topbar-inner">
        <nav class="mode-toggle" aria-label="练习模式">
          <RouterLink class="mode-link" to="/">背诵</RouterLink>
          <RouterLink class="mode-link" to="/spell">拼写</RouterLink>
        </nav>

        <div class="book-picker">
          <button class="book-trigger" type="button" @click="isBookMenuOpen = !isBookMenuOpen">
            <BookOpen class="book-icon" aria-hidden="true" :size="24" :stroke-width="1.9" />
            <span>{{ selectedBook?.title || '选择单词本' }}</span>
            <ChevronDown class="chevron-icon" aria-hidden="true" :size="22" :stroke-width="2.1" />
          </button>

          <div v-if="isBookMenuOpen" class="book-menu">
            <button
              v-for="book in books"
              :key="book.id"
              class="book-option"
              :class="{ active: book.id === selectedBookId }"
              type="button"
              @click="selectBook(book.id)"
            >
              {{ book.title }}
            </button>
          </div>

          <Teleport to="body">
            <div
              v-if="isBookMenuOpen"
              class="book-dialog-backdrop"
              role="presentation"
              @click.self="isBookMenuOpen = false"
            >
              <section class="book-dialog" role="dialog" aria-modal="true" aria-labelledby="book-dialog-title">
                <div class="book-dialog-head">
                  <h2 id="book-dialog-title">选择单词本</h2>
                  <button class="book-dialog-close" type="button" aria-label="关闭" @click="isBookMenuOpen = false">
                    ×
                  </button>
                </div>

                <div class="book-dialog-list">
                  <button
                    v-for="book in books"
                    :key="book.id"
                    class="book-dialog-option"
                    :class="{ active: book.id === selectedBookId }"
                    type="button"
                    @click="selectBook(book.id)"
                  >
                    {{ book.title }}
                  </button>
                </div>
              </section>
            </div>
          </Teleport>
        </div>

        <div class="order-toggle" aria-label="排序方式">
          <button
            class="order-button"
            :class="{ active: orderMode === 'sequence' }"
            type="button"
            @click="setOrderMode('sequence')"
          >
            顺序
          </button>
          <button
            class="order-button"
            :class="{ active: orderMode === 'shuffle' }"
            type="button"
            @click="setOrderMode('shuffle')"
          >
            打乱
          </button>
        </div>
      </div>
    </header>

    <section class="stage-scroll">
      <div class="stage-inner">
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            :error-message="errorMessage"
            :is-loading="isLoading"
            :visible-words="visibleWords"
            :words="words"
            @word-click="handleWordClick"
          />
        </RouterView>
      </div>
    </section>
  </main>
</template>
