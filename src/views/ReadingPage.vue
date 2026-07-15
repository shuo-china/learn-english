<script setup>
import { ChevronLeft, ChevronRight, Diamond, Leaf } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadBookArticle } from '../lib/articles'
import { splitEnglishWords } from '../lib/englishText.js'
import { lookupYoudaoWord } from '../lib/youdaoDictionary'
import { playPronunciation } from '../lib/pronunciation'

const props = defineProps({
  articleFiles: {
    type: Array,
    default: () => [],
  },
  selectedBook: {
    type: Object,
    default: null,
  },
})

const article = ref(null)
const articleIndex = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const dictionaryCard = ref(null)
const dictionaryCardElement = ref(null)
let dictionaryRequestController = null
let requestId = 0

const articleFiles = computed(() => props.articleFiles.length ? props.articleFiles : (props.selectedBook?.article_files ?? []))
const articleCount = computed(() => articleFiles.value.length)
const progressLabel = computed(() =>
  articleCount.value ? `${articleIndex.value + 1} / ${articleCount.value}` : '',
)
const highlightedWords = computed(() => new Set(
  (article.value?.highlightWords ?? []).map((word) => word.toLowerCase()),
))

function isHighlightedWord(word) {
  return highlightedWords.value.has(word.toLowerCase())
}

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
    const loadedArticle = await loadBookArticle(props.selectedBook, articleIndex.value, articleFiles.value)

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

function placeDictionaryCard(target) {
  const bounds = target.getBoundingClientRect()
  const maximumCardWidth = Math.min(360, window.innerWidth - 24)
  const left = Math.min(
    Math.max(maximumCardWidth / 2 + 12, bounds.left + bounds.width / 2),
    window.innerWidth - maximumCardWidth / 2 - 12,
  )

  return {
    left,
    top: Math.min(bounds.bottom + 10, window.innerHeight - 180),
  }
}

async function openDictionary(word, event) {
  dictionaryRequestController?.abort()
  const controller = new AbortController()
  dictionaryRequestController = controller
  dictionaryCard.value = { word, state: 'loading', ...placeDictionaryCard(event.currentTarget) }
  playPronunciation(word)

  try {
    const entry = await lookupYoudaoWord(word, { signal: controller.signal })
    if (dictionaryRequestController === controller) {
      dictionaryCard.value = { ...dictionaryCard.value, state: 'ready', ...entry }
    }
  } catch (error) {
    if (error.name !== 'AbortError' && dictionaryRequestController === controller) {
      dictionaryCard.value = { ...dictionaryCard.value, state: 'error', message: error.message || '词典查询暂时不可用' }
    }
  }
}

function closeDictionary() {
  dictionaryRequestController?.abort()
  dictionaryRequestController = null
  dictionaryCard.value = null
}

function closeDictionaryOnOutsideClick(event) {
  if (dictionaryCardElement.value && !dictionaryCardElement.value.contains(event.target)) {
    closeDictionary()
  }
}

onMounted(() => document.addEventListener('pointerdown', closeDictionaryOnOutsideClick))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeDictionaryOnOutsideClick)
  dictionaryRequestController?.abort()
})

watch(
  () => props.selectedBook?.folder,
  () => {
    articleIndex.value = 0
  },
)

watch([() => props.selectedBook?.folder, articleIndex, articleFiles], loadCurrentArticle, { immediate: true })
</script>

<template>
  <article class="relative mx-auto min-h-[calc(100dvh-90px)] w-full max-w-[1100px] overflow-hidden rounded-[14px] border border-[rgba(93,103,45,0.56)] bg-[rgba(255,252,237,0.94)] text-[#183b27] shadow-[0_14px_34px_rgba(43,58,30,0.18)] backdrop-blur-[5px] md:mt-5 md:min-h-[748px]" aria-live="polite">
    <div v-if="isLoading" class="grid min-h-[calc(100dvh-90px)] place-items-center p-[30px] text-center text-xl font-bold text-[#3e6749] md:min-h-[748px]">正在翻开文章...</div>
    <div v-else-if="errorMessage" class="grid min-h-[calc(100dvh-90px)] place-items-center p-[30px] text-center text-xl font-bold text-[#9f492f] md:min-h-[748px]">{{ errorMessage }}</div>
    <div v-else-if="!articleCount" class="grid min-h-[calc(100dvh-90px)] place-items-center p-[30px] text-center text-xl font-bold text-[#3e6749] md:min-h-[748px]">该单词书暂无配套文章</div>

    <div v-else-if="article" class="flex min-h-[calc(100dvh-90px)] flex-col md:min-h-[748px]">
      <header class="relative px-5 pt-9 pb-3 text-center md:px-[68px] md:pt-[48px]">
        <h1 class="m-0 font-[family-name:var(--reading-english-font)] text-[30px] leading-[1.08] font-normal tracking-[-0.025em] [word-spacing:0.15em] text-[#173d29] md:text-4xl">
          <template v-for="(part, partIndex) in splitEnglishWords(article.title)" :key="partIndex">
            <button
              v-if="part.isWord"
              class="cursor-pointer rounded-sm border-0 bg-transparent px-0 font-inherit text-inherit transition-colors hover:bg-[rgba(232,196,87,0.23)] hover:text-[#255238] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd8f2f]"
              :style="isHighlightedWord(part.text) ? { color: '#b58116' } : undefined"
              type="button"
              :aria-label="`Look up ${part.text}`"
              @click="openDictionary(part.text, $event)"
            >{{ part.text }}</button>
            <span v-else>{{ part.text }}</span>
          </template>
        </h1>

        <div class="mt-6 flex items-center gap-2 text-[#a98218] md:mt-[26px]" aria-hidden="true">
          <span class="h-px flex-1 bg-[rgba(126,110,56,0.52)]"></span>
          <Diamond :size="10" :stroke-width="1.6" class="shrink-0 fill-current" />
          <span class="h-px flex-1 bg-[rgba(126,110,56,0.52)]"></span>
        </div>
      </header>

      <div class="grid gap-4 px-5 pb-7 md:px-[68px] md:pb-8">
        <section
          v-for="(paragraph, paragraphIndex) in article.paragraphs"
          :key="paragraphIndex"
          class="relative rotate-0 rounded-none border-0 bg-transparent p-0 shadow-none"
        >
          <p class="m-0 font-[family-name:var(--reading-english-font)] text-xl leading-[1.75] font-normal tracking-[0.006em] text-[#193a28] [word-spacing:0.055em] md:text-[26px] md:leading-[1.8]">
            <template v-for="(part, partIndex) in splitEnglishWords(paragraph.english)" :key="partIndex">
              <button
                v-if="part.isWord"
                class="cursor-pointer rounded-sm border-0 bg-transparent px-0 font-inherit text-inherit transition-colors hover:bg-[rgba(232,196,87,0.23)] hover:text-[#255238] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd8f2f]"
                :style="isHighlightedWord(part.text) ? { color: '#b58116' } : undefined"
                type="button"
                :aria-label="`查询 ${part.text}`"
                @click="openDictionary(part.text, $event)"
              >{{ part.text }}</button>
              <span v-else>{{ part.text }}</span>
            </template>
          </p>
          <p class="mt-4 mb-0 rounded border-0 bg-[rgba(218,220,185,0.42)] px-3 py-2 font-[family-name:var(--chinese-font)] text-lg leading-[1.9] font-normal text-[#275238] md:mt-5 md:px-4 md:py-3 md:text-2xl md:leading-[1.95]">{{ paragraph.chinese }}</p>
        </section>
      </div>

      <footer class="mx-auto mt-auto grid w-[min(100%,210px)] grid-cols-[1fr_auto_1fr] items-center gap-4 border-0 pb-6 md:w-[min(100%,280px)] md:gap-6 md:pb-7" aria-label="文章切换">
        <button
          class="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[9px] border border-[rgba(118,108,58,0.42)] bg-[rgba(255,252,237,0.58)] p-0 text-[#315b38] shadow-[0_2px_5px_rgba(60,65,35,0.04)] transition-[background-color,color,box-shadow] duration-150 hover:not-disabled:bg-[#315b38] hover:not-disabled:text-[#fffdf1] hover:not-disabled:shadow-[0_5px_12px_rgba(49,91,56,0.16)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(184,139,28,0.5)] disabled:cursor-not-allowed disabled:opacity-35 md:size-11"
          type="button"
          :disabled="articleIndex === 0"
          @click="goToPreviousArticle"
        >
          <ChevronLeft aria-hidden="true" :size="22" :stroke-width="1.8" />
          <span class="absolute size-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)] [clip-path:inset(50%)]">上一篇</span>
        </button>

        <span class="min-w-14 bg-transparent p-0 text-center font-[family-name:var(--reading-english-font)] text-lg font-normal tracking-[0.04em] text-[#193a28] md:text-[22px]">{{ progressLabel }}</span>

        <button
          class="relative inline-flex size-10 cursor-pointer items-center justify-center justify-self-end rounded-[9px] border border-[rgba(118,108,58,0.42)] bg-[rgba(255,252,237,0.58)] p-0 text-[#315b38] shadow-[0_2px_5px_rgba(60,65,35,0.04)] transition-[background-color,color,box-shadow] duration-150 hover:not-disabled:bg-[#315b38] hover:not-disabled:text-[#fffdf1] hover:not-disabled:shadow-[0_5px_12px_rgba(49,91,56,0.16)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(184,139,28,0.5)] disabled:cursor-not-allowed disabled:opacity-35 md:size-11"
          type="button"
          :disabled="articleIndex >= articleCount - 1"
          @click="goToNextArticle"
        >
          <span class="absolute size-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)] [clip-path:inset(50%)]">下一篇</span>
          <ChevronRight aria-hidden="true" :size="22" :stroke-width="1.8" />
        </button>
      </footer>
    </div>

    <Teleport to="body">
      <section v-if="dictionaryCard" ref="dictionaryCardElement" class="fixed z-[120] w-fit min-w-[212px] max-w-[min(calc(100%-24px),360px)] overflow-hidden rounded-[24px_18px_26px_17px] border-2 border-[rgba(99,121,61,0.52)] bg-[#fff9df] p-3 text-[#274633] shadow-[0_16px_38px_rgba(35,62,40,0.26),inset_0_1px_0_rgba(255,255,255,0.88)]" :style="{ left: `${dictionaryCard.left}px`, top: `${dictionaryCard.top}px`, transform: 'translateX(-50%)' }" role="dialog" :aria-label="`${dictionaryCard.word} 的词典释义`">
        <div class="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(circle_at_14%_12%,rgba(255,255,255,0.9),transparent_23%),radial-gradient(circle_at_90%_88%,rgba(174,202,120,0.28),transparent_34%),repeating-linear-gradient(0deg,transparent_0_5px,rgba(112,129,75,0.035)_5px_6px)]"></div>
        <div class="relative flex items-center gap-2 text-[#83974e]">
          <Leaf :size="17" aria-hidden="true" />
          <span class="font-[family-name:var(--chinese-font)] text-[13px] tracking-[0.12em]">森林词典</span>
        </div>
        <div class="relative mt-1">
          <div class="flex items-baseline gap-3">
            <h2 class="m-0 font-[family-name:var(--reading-english-font)] text-2xl font-normal tracking-[-0.02em] text-[#214933] md:text-[28px]">{{ dictionaryCard.word }}</h2>
            <span v-if="dictionaryCard.phonetic" class="font-[family-name:var(--reading-english-font)] text-sm text-[#667355]">/{{ dictionaryCard.phonetic }}/</span>
          </div>
          <div v-if="dictionaryCard.state === 'loading'" class="mt-2 rounded-[13px_9px_12px_8px] bg-[rgba(190,206,139,0.24)] px-2.5 py-1.5 font-[family-name:var(--chinese-font)] text-xl leading-relaxed text-[#8b9088]">
            正在翻阅词典…
          </div>
          <div v-else-if="dictionaryCard.state === 'error'" class="mt-2 rounded-[16px_12px_15px_10px] bg-[rgba(209,144,100,0.13)] p-3 font-[family-name:var(--chinese-font)] text-base text-[#8a4c37]">{{ dictionaryCard.message }}</div>
          <template v-else>
            <ul class="mt-2 grid gap-2 p-0 font-[family-name:var(--chinese-font)] text-base leading-relaxed text-[#275238] md:text-xl">
              <li v-for="meaning in dictionaryCard.meanings" :key="meaning" class="list-none rounded-[13px_9px_12px_8px] bg-[rgba(190,206,139,0.24)] px-2.5 py-1.5">{{ meaning }}</li>
            </ul>
            <p v-if="dictionaryCard.example" class="mt-5 mb-0 border-l-2 border-[#aab868] pl-3 font-[family-name:var(--reading-english-font)] text-base leading-relaxed text-[#4d6148]">{{ dictionaryCard.example }}</p>
            <p v-if="dictionaryCard.exampleTranslation" class="mt-1 mb-0 pl-3 font-[family-name:var(--chinese-font)] text-sm text-[#718064]">{{ dictionaryCard.exampleTranslation }}</p>
            <p v-if="!dictionaryCard.meanings.length" class="mt-6 font-[family-name:var(--chinese-font)] text-base text-[#657257]">暂未找到简明释义。</p>
          </template>
        </div>
      </section>
    </Teleport>
  </article>
</template>
