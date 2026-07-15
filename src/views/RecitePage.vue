<script setup>
import { clearReciteSelection } from '../lib/reciteSelection'

defineProps({
  errorMessage: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  visibleWords: {
    type: Array,
    default: () => [],
  },
  words: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['word-click'])

function handleWordClick(wordId) {
  const selection = window.getSelection?.()

  clearReciteSelection(selection)
  emit('word-click', wordId)
}
</script>

<template>
  <div class="relative min-h-[550px] rounded-xl border-[1.5px] border-[rgba(83,112,67,0.48)] px-3.5 pt-3 pb-[18px] [background:linear-gradient(180deg,rgba(255,252,239,0.96),rgba(255,250,233,0.93)),radial-gradient(circle_at_80%_12%,rgba(202,188,132,0.08),transparent_26%)] shadow-[0_28px_55px_rgba(49,61,40,0.17),inset_0_1px_0_rgba(255,255,255,0.7)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[repeating-linear-gradient(0deg,transparent_0_33px,rgba(70,94,55,0.035)_33px_34px),repeating-linear-gradient(90deg,rgba(97,116,75,0.025)_0_1px,transparent_1px_31px)] before:opacity-35 before:content-[''] md:px-[42px] md:py-4">
    <div v-if="isLoading" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">正在翻开单词本...</div>
    <div v-else-if="errorMessage" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">{{ errorMessage }}</div>
    <div v-else-if="!visibleWords.length" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">这个单词本还没有可背诵的内容</div>

    <div v-else class="relative z-[1]">
      <div
        v-for="word in visibleWords"
        :key="word.id"
        class="relative z-[1] grid h-20 max-h-20 min-h-20 w-full grid-cols-1 grid-rows-[auto_minmax(26px,auto)] content-center items-center gap-y-2 overflow-hidden border-0 border-b-[1.5px] border-[rgba(98,123,75,0.32)] bg-transparent text-left text-inherit md:h-auto md:max-h-none md:min-h-[62px] md:grid-cols-[minmax(250px,1fr)_minmax(320px,0.92fr)] md:grid-rows-none md:gap-y-0"
        :class="word.isKey ? '!bg-[linear-gradient(90deg,rgba(222,176,72,0.18),rgba(222,176,72,0.05)_54%,transparent)]' : ''"
      >
        <span
          class="flex cursor-text select-text items-center gap-3.5 pl-6 font-[family-name:var(--english-font)] text-2xl leading-[1.05] font-bold tracking-normal text-[#142a1e] md:pl-[92px] md:text-[28px] md:leading-normal"
          :class="word.isKey ? '!text-[#b58116]' : ''"
        >{{ word.word }}</span>
        <button
          class="flex h-[26px] min-h-0 w-full cursor-pointer select-none appearance-none items-center overflow-hidden border-0 bg-transparent pl-6 text-left text-inherit focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[rgba(68,119,58,0.45)] md:h-auto md:min-h-[62px] md:overflow-visible md:pl-[18px]"
          type="button"
          @click="handleWordClick(word.id)"
        >
          <span v-if="word.revealed" class="line-clamp-2 overflow-hidden font-[family-name:var(--chinese-font)] text-xl leading-[1.1] font-bold tracking-normal text-[#bf650f] md:block md:overflow-visible md:text-2xl md:leading-[1.15]">{{ word.meaning }}</span>
          <span v-else class="block h-6 w-[min(72%,285px)] rounded-full bg-[radial-gradient(ellipse_at_28%_45%,rgba(129,143,107,0.32),transparent_56%),radial-gradient(ellipse_at_70%_52%,rgba(122,139,102,0.26),transparent_60%),linear-gradient(90deg,rgba(130,145,112,0.12),rgba(126,143,108,0.22),rgba(130,145,112,0.1))] opacity-70 blur-[6px] md:h-[35px]" aria-hidden="true"></span>
        </button>
      </div>
      <div class="relative z-[1] grid min-h-12 place-items-center px-1 pt-4 text-center font-[family-name:var(--english-font)] text-base font-extrabold text-[#6f5b25]" aria-live="polite">共 {{ words.length }} 个单词</div>
    </div>
  </div>
</template>
