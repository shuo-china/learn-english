<script setup>
import { BookOpen, ChevronDown } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { playPronunciation } from './lib/pronunciation'
import { createShuffledWordIds, loadBooksIndex, loadVocabularyWords } from './lib/vocabulary'

const books = ref([])
const selectedBookFolder = ref('')
const words = ref([])
const orderMode = ref('sequence')
const shuffledIds = ref([])
const shuffledArticleFiles = ref([])
const isBookMenuOpen = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')
const route = useRoute()

const selectedBook = computed(() =>
  books.value.find((book) => book.folder === selectedBookFolder.value),
)

const isSpellingMode = computed(() => route.name === 'spell')
const isReadingMode = computed(() => route.name === 'reading')
const shellBackgroundClass = computed(() => {
  if (isSpellingMode.value) {
    return "[background:linear-gradient(180deg,rgba(255,250,225,0.2),rgba(235,226,177,0.1)),url('/assets/spelling-meadow-bg.png')_center/cover_no-repeat_fixed,#edf0d1]"
  }

  if (isReadingMode.value) {
    return "[background:linear-gradient(180deg,rgba(232,246,228,0.08),rgba(35,83,62,0.12)),url('/assets/reading-countryside-bg.png')_43%_center/cover_no-repeat_scroll,#cfe7c1] md:[background:linear-gradient(180deg,rgba(232,246,228,0.08),rgba(35,83,62,0.12)),url('/assets/reading-countryside-bg.png')_center/cover_no-repeat_fixed,#cfe7c1]"
  }

  return "[background:linear-gradient(rgba(255,252,238,0.12),rgba(255,252,238,0.12)),url('/assets/recite-forest-study-bg.png')_bottom_center/cover_no-repeat_fixed,#f3ead4]"
})

const visibleWords = computed(() => {
  if (orderMode.value !== 'shuffle') {
    return words.value
  }

  const byId = new Map(words.value.map((word) => [word.id, word]))
  return shuffledIds.value.map((id) => byId.get(id)).filter(Boolean)
})

const visibleArticleFiles = computed(() => {
  if (orderMode.value !== 'shuffle') {
    return selectedBook.value?.article_files ?? []
  }

  return shuffledArticleFiles.value
})

function shuffleWordIds(items) {
  shuffledIds.value = createShuffledWordIds(items)
}

function shuffleArticleFiles(articleFiles) {
  const shuffled = [...(articleFiles ?? [])]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  shuffledArticleFiles.value = shuffled
}

async function loadBooks() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    books.value = await loadBooksIndex()
    selectedBookFolder.value = books.value[0]?.folder ?? ''
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
    shuffleArticleFiles(selectedBook.value.article_files)
  } catch (error) {
    words.value = []
    errorMessage.value = error.message || '单词本加载失败'
  } finally {
    isLoading.value = false
  }
}

function selectBook(bookFolder) {
  selectedBookFolder.value = bookFolder
  isBookMenuOpen.value = false
}

function setOrderMode(mode) {
  orderMode.value = mode

  if (mode === 'shuffle') {
    shuffleWordIds(words.value)
    shuffleArticleFiles(selectedBook.value?.article_files)
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

watch(selectedBookFolder, loadSelectedBook)

onMounted(loadBooks)
</script>

<template>
  <main
    class="h-dvh min-h-dvh min-w-80 overflow-hidden text-[#173223]"
    :class="shellBackgroundClass"
  >
    <header class="relative z-10 h-[66px] border-b-[1.5px] border-[rgba(78,106,66,0.42)] [background:linear-gradient(180deg,rgba(255,252,239,0.94),rgba(250,246,228,0.9)),radial-gradient(circle_at_28%_0%,rgba(121,145,89,0.08),transparent_34%)] shadow-[0_5px_20px_rgba(49,67,43,0.07)] after:pointer-events-none after:absolute after:inset-0 after:content-[''] after:bg-[linear-gradient(rgba(75,96,57,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(75,96,57,0.025)_1px,transparent_1px)] after:bg-[length:28px_28px] after:opacity-45 md:h-20">
      <div class="relative z-[1] flex h-full w-full items-center justify-between px-4 font-[family-name:var(--chinese-font)] md:px-[42px]">
        <nav class="relative grid h-10 w-[120px] grid-cols-3 overflow-visible rounded-[16px_13px_17px_12px] border-2 border-[rgba(91,122,71,0.36)] p-[3px] [background:radial-gradient(ellipse_at_18%_12%,rgba(255,255,255,0.78),transparent_38%),linear-gradient(180deg,rgba(255,249,221,0.95),rgba(235,226,178,0.91))] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_5px_12px_rgba(49,67,43,0.1)] md:absolute md:left-[42px] md:h-[46px] md:w-[258px] md:p-1 md:border-[rgba(82,101,57,0.44)] md:rounded-[17px_14px_18px_13px] md:shadow-[inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-5px_12px_rgba(158,135,75,0.1),0_8px_18px_rgba(49,67,43,0.11)]" aria-label="练习模式">
          <RouterLink class="relative z-[1] grid min-w-0 place-items-center rounded-[12px_10px_13px_10px] text-sm leading-none font-semibold text-[#314a2b] no-underline transition-[color,background-color,box-shadow] duration-160 hover:bg-[rgba(119,151,88,0.11)] hover:text-[#20462f] [&.router-link-active]:bg-[radial-gradient(ellipse_at_25%_18%,rgba(255,255,255,0.24),transparent_44%),linear-gradient(180deg,rgba(71,122,96,0.96),rgba(45,91,75,0.98))] [&.router-link-active]:text-[#fffaf0] [&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:rounded-[14px_11px_15px_12px] md:text-xl md:font-bold md:[&.router-link-active]:text-[#fff9df] md:[&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" to="/recite">
            <span class="hidden md:inline">背诵</span>
            <span class="inline md:hidden">背</span>
          </RouterLink>
          <RouterLink class="relative z-[1] grid min-w-0 place-items-center rounded-[12px_10px_13px_10px] text-sm leading-none font-semibold text-[#314a2b] no-underline transition-[color,background-color,box-shadow] duration-160 hover:bg-[rgba(119,151,88,0.11)] hover:text-[#20462f] [&.router-link-active]:bg-[radial-gradient(ellipse_at_25%_18%,rgba(255,255,255,0.24),transparent_44%),linear-gradient(180deg,rgba(71,122,96,0.96),rgba(45,91,75,0.98))] [&.router-link-active]:text-[#fffaf0] [&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:rounded-[14px_11px_15px_12px] md:text-xl md:font-bold md:[&.router-link-active]:text-[#fff9df] md:[&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" to="/spell">
            <span class="hidden md:inline">拼写</span>
            <span class="inline md:hidden">写</span>
          </RouterLink>
          <RouterLink class="relative z-[1] grid min-w-0 place-items-center rounded-[12px_10px_13px_10px] text-sm leading-none font-semibold text-[#314a2b] no-underline transition-[color,background-color,box-shadow] duration-160 hover:bg-[rgba(119,151,88,0.11)] hover:text-[#20462f] [&.router-link-active]:bg-[radial-gradient(ellipse_at_25%_18%,rgba(255,255,255,0.24),transparent_44%),linear-gradient(180deg,rgba(71,122,96,0.96),rgba(45,91,75,0.98))] [&.router-link-active]:text-[#fffaf0] [&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:rounded-[14px_11px_15px_12px] md:text-xl md:font-bold md:[&.router-link-active]:text-[#fff9df] md:[&.router-link-active]:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" to="/reading">
            <span class="hidden md:inline">阅读</span>
            <span class="inline md:hidden">读</span>
          </RouterLink>
        </nav>

        <div class="absolute left-[calc(50%-24px)] w-12 md:left-[calc(50%-110px)] md:w-auto">
          <button class="flex h-10 w-12 cursor-pointer items-center justify-center gap-3 rounded-[15px_12px_16px_11px] border-2 border-[rgba(82,101,57,0.42)] px-3 font-[family-name:var(--chinese-font)] text-sm leading-none font-semibold tracking-normal text-[#314a2b] [background:radial-gradient(ellipse_at_20%_12%,rgba(255,255,255,0.78),transparent_40%),linear-gradient(180deg,rgba(255,250,225,0.96),rgba(236,227,181,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),0_5px_12px_rgba(49,67,43,0.1)] transition-[color,box-shadow] duration-160 hover:text-[#20462f] md:h-[46px] md:w-auto md:min-w-[205px] md:justify-start md:px-[17px] md:text-xl md:font-bold md:rounded-[17px_14px_18px_13px] md:shadow-[inset_0_2px_0_rgba(255,255,255,0.62),inset_0_-5px_12px_rgba(158,135,75,0.09),0_7px_16px_rgba(49,67,43,0.1)] md:hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.68),inset_0_-5px_12px_rgba(158,135,75,0.11),0_9px_18px_rgba(49,67,43,0.13)]" type="button" @click="isBookMenuOpen = !isBookMenuOpen">
            <BookOpen class="shrink-0 text-[#477460]" aria-hidden="true" :size="24" :stroke-width="1.9" />
            <span class="hidden md:inline">{{ selectedBook?.title || '选择单词本' }}</span>
            <ChevronDown class="ml-auto hidden shrink-0 text-[#314a2b] md:block" aria-hidden="true" :size="22" :stroke-width="2.1" />
          </button>

          <div v-if="isBookMenuOpen" class="absolute top-[calc(100%+10px)] left-0 z-30 hidden w-[220px] gap-1.5 rounded-[10px] border-[1.5px] border-[rgba(82,112,67,0.38)] bg-[rgba(255,252,237,0.97)] p-[9px] shadow-[0_18px_36px_rgba(42,61,37,0.16)] md:grid">
            <button
              v-for="book in books"
              :key="book.folder"
              class="block w-full cursor-pointer rounded-[7px] border-0 bg-transparent px-[13px] py-2.5 text-left text-lg font-semibold text-[#2c4b30] hover:bg-[rgba(96,132,79,0.15)] hover:text-[#1f522f]"
              :class="book.folder === selectedBookFolder ? '!bg-[rgba(96,132,79,0.15)] !text-[#1f522f]' : ''"
              type="button"
              @click="selectBook(book.folder)"
            >
              {{ book.title }}
            </button>
          </div>

          <Teleport to="body">
            <div
              v-if="isBookMenuOpen"
              class="fixed inset-0 z-[100] grid place-items-center bg-[rgba(20,31,24,0.34)] p-[22px] md:hidden"
              role="presentation"
              @click.self="isBookMenuOpen = false"
            >
              <section class="grid max-h-[min(72vh,520px)] w-[min(100%,360px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border-[1.5px] border-[rgba(82,112,67,0.34)] bg-[rgba(255,252,239,0.98)] shadow-[0_24px_60px_rgba(35,49,36,0.28)]" role="dialog" aria-modal="true" aria-labelledby="book-dialog-title">
                <div class="flex min-h-14 items-center justify-between border-b border-[rgba(91,122,71,0.22)] py-0 pr-3.5 pl-[18px]">
                  <h2 id="book-dialog-title" class="m-0 text-xl font-bold text-[#203725]">选择单词本</h2>
                  <button class="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent font-[family-name:var(--english-font)] text-2xl leading-none text-[#29442d] hover:bg-[rgba(96,132,79,0.13)]" type="button" aria-label="关闭" @click="isBookMenuOpen = false">
                    ×
                  </button>
                </div>

                <div class="grid min-h-0 gap-1.5 overflow-y-auto p-2.5">
                  <button
                    v-for="book in books"
                    :key="book.folder"
                    class="min-h-12 w-full cursor-pointer rounded-lg border-0 bg-transparent px-3.5 text-left text-lg font-bold text-[#29442d]"
                    :class="book.folder === selectedBookFolder ? '!bg-[rgba(63,105,67,0.92)] !text-[#fffaf0]' : ''"
                    type="button"
                    @click="selectBook(book.folder)"
                  >
                    {{ book.title }}
                  </button>
                </div>
              </section>
            </div>
          </Teleport>
        </div>

        <div class="relative grid h-10 w-[116px] grid-cols-2 overflow-visible rounded-[16px_13px_17px_12px] border-2 border-[rgba(91,122,71,0.36)] p-[3px] [background:radial-gradient(ellipse_at_18%_12%,rgba(255,255,255,0.78),transparent_38%),linear-gradient(180deg,rgba(255,249,221,0.95),rgba(235,226,178,0.91))] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_5px_12px_rgba(49,67,43,0.1)] md:absolute md:right-[42px] md:h-[46px] md:w-[178px] md:p-1 md:border-[rgba(82,101,57,0.44)] md:rounded-[17px_14px_18px_13px] md:shadow-[inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-5px_12px_rgba(158,135,75,0.1),0_8px_18px_rgba(49,67,43,0.11)]" aria-label="排序方式">
          <button
            class="min-w-0 cursor-pointer rounded-[12px_10px_13px_10px] border-0 bg-transparent font-[family-name:var(--chinese-font)] text-sm leading-none font-semibold tracking-normal text-[#314a2b] transition-[color,background-color,box-shadow] duration-160 hover:bg-[rgba(119,151,88,0.11)] hover:text-[#20462f] md:rounded-[14px_11px_15px_12px] md:text-xl md:font-bold"
            :class="orderMode === 'sequence' ? '!bg-[radial-gradient(ellipse_at_25%_18%,rgba(255,255,255,0.24),transparent_44%),linear-gradient(180deg,rgba(71,122,96,0.96),rgba(45,91,75,0.98))] !text-[#fffaf0] !shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:!text-[#fff9df] md:!shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]' : ''"
            type="button"
            @click="setOrderMode('sequence')"
          >
            <span class="md:hidden">顺</span>
            <span class="hidden md:inline">顺序</span>
          </button>
          <button
            class="min-w-0 cursor-pointer rounded-[12px_10px_13px_10px] border-0 bg-transparent font-[family-name:var(--chinese-font)] text-sm leading-none font-semibold tracking-normal text-[#314a2b] transition-[color,background-color,box-shadow] duration-160 hover:bg-[rgba(119,151,88,0.11)] hover:text-[#20462f] md:rounded-[14px_11px_15px_12px] md:text-xl md:font-bold"
            :class="orderMode === 'shuffle' ? '!bg-[radial-gradient(ellipse_at_25%_18%,rgba(255,255,255,0.24),transparent_44%),linear-gradient(180deg,rgba(71,122,96,0.96),rgba(45,91,75,0.98))] !text-[#fffaf0] !shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:!text-[#fff9df] md:!shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]' : ''"
            type="button"
            @click="setOrderMode('shuffle')"
          >
            <span class="md:hidden">乱</span>
            <span class="hidden md:inline">打乱</span>
          </button>
        </div>
      </div>
    </header>

    <section class="relative z-[1] h-[calc(100dvh-66px)] overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(90,119,75,0.34)_rgba(255,252,239,0.24)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[rgba(255,252,239,0.22)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-[rgba(255,252,239,0.22)] [&::-webkit-scrollbar-thumb]:bg-[rgba(90,119,75,0.34)] hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(73,105,62,0.48)] md:h-[calc(100dvh-80px)]" :class="isSpellingMode ? '!overflow-y-hidden md:!overflow-y-auto' : ''">
      <div
        class="mx-auto w-[min(calc(100%-28px),1090px)] py-6 md:w-[min(calc(100%-56px),1000px)] md:py-[38px]"
        :class="{
          'h-full !py-4 md:h-auto md:!py-[38px]': isSpellingMode,
          '!w-[calc(100%-16px)] !py-6 md:!w-[min(calc(100%-64px),1040px)] md:!py-[38px] md:!pb-16': isReadingMode,
        }"
      >
        <RouterView v-slot="{ Component }">
          <component
            :is="Component"
            :error-message="errorMessage"
            :is-loading="isLoading"
            :visible-words="visibleWords"
            :article-files="visibleArticleFiles"
            :words="words"
            :selected-book="selectedBook"
            @word-click="handleWordClick"
          />
        </RouterView>
      </div>
    </section>
  </main>
</template>
