<script setup>
import { BookOpen, ChevronDown } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

const books = ref([])
const selectedBookId = ref('')
const words = ref([])
const orderMode = ref('sequence')
const shuffledIds = ref([])
const isBookMenuOpen = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')
let activeAudio = null

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

function parseMarkdownBook(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const normalizedLine = line.replace(/^[-*]\s+/, '')
      const match =
        normalizedLine.match(/^(.+?)\s*[:：]\s*(.+)$/) ||
        normalizedLine.match(/^([A-Za-z][A-Za-z'’-]*(?:\s+[A-Za-z][A-Za-z'’-]*)*)\s+(.+)$/)

      if (!match) {
        return null
      }

      return {
        id: `${index}-${match[1].trim().toLowerCase().replace(/\s+/g, '-')}`,
        word: match[1].trim(),
        meaning: match[2].trim(),
        revealed: false,
      }
    })
    .filter(Boolean)
}

function parseVocabularyText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const isKey = line.startsWith('! ')
      const normalizedLine = line.replace(/^!\s+/, '').replace(/^[-*]\s+/, '')
      const match = normalizedLine.match(/^(\S+)\s+(.+)$/)

      if (!match) {
        return null
      }

      return {
        id: `${index}-${match[1].trim().toLowerCase().replace(/\s+/g, '-')}`,
        word: match[1].trim(),
        meaning: match[2].trim(),
        isKey,
        revealed: false,
      }
    })
    .filter(Boolean)
}

function shuffleWordIds(items) {
  const ids = items.map((item) => item.id)

  for (let index = ids.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]]
  }

  shuffledIds.value = ids
}

async function loadBooks() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('/books/index.json')

    if (!response.ok) {
      throw new Error('无法读取单词本清单')
    }

    books.value = await response.json()
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
    const response = await fetch(`/books/${selectedBook.value.file}`)

    if (!response.ok) {
      throw new Error(`无法读取 ${selectedBook.value.title}`)
    }

    words.value = parseVocabularyText(await response.text())
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
}

function setOrderMode(mode) {
  orderMode.value = mode

  if (mode === 'shuffle') {
    shuffleWordIds(words.value)
  }
}

function createYoudaoDictionaryUrl(text) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`
}

function playPronunciation(text) {
  try {
    if (activeAudio) {
      activeAudio.pause()
    }

    activeAudio = new Audio(createYoudaoDictionaryUrl(text))
    activeAudio.play().catch((error) => console.warn(error))
  } catch (error) {
    console.warn(error)
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
        <h1 class="app-title">单词背诵</h1>

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
        <div class="word-paper">
          <div v-if="isLoading" class="empty-state">正在翻开单词本...</div>
          <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
          <div v-else-if="!visibleWords.length" class="empty-state">这个单词本还没有可背诵的内容</div>

          <div v-else class="word-list">
            <button
              v-for="word in visibleWords"
              :key="word.id"
              class="word-row"
              :class="{ revealed: word.revealed, key: word.isKey }"
              type="button"
              @click="handleWordClick(word.id)"
            >
              <span class="word-text">{{ word.word }}</span>
              <span class="meaning-cell">
                <span v-if="word.revealed" class="meaning-text">{{ word.meaning }}</span>
                <span v-else class="meaning-mask" aria-hidden="true"></span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
