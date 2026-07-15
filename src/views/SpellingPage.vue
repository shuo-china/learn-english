<script setup>
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { playPronunciation } from '../lib/pronunciation'
import { playErrorSound, playRightSound, playTypingSound, preloadSoundEffects } from '../lib/soundEffects'

const props = defineProps({
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

const spellingStage = ref(null)
const spellingInput = ref(null)
const questionIndex = ref(0)
const inputs = ref([])
const mobileInputSentinel = ' '
const mobileInputValue = ref(mobileInputSentinel)
const lockedSegments = ref([])
const segmentStatuses = ref([])
const activeSegmentIndex = ref(0)
const shouldFocusFirstError = ref(false)
const isAnswerShown = ref(false)
const wrongSubmitCount = ref(0)
const lastWrongSubmissionKey = ref('')
const didHandleMobileBeforeInput = ref(false)
let mobileBeforeInputIgnoreUntil = 0
let mobileBeforeInputResetTimer = null

const currentWord = computed(() => props.visibleWords[questionIndex.value] ?? null)
const answerSegments = computed(() => currentWord.value?.word.trim().split(/\s+/).filter(Boolean) ?? [])
const progressLabel = computed(
  () => `${Math.min(questionIndex.value + 1, props.visibleWords.length)}/${props.visibleWords.length}`,
)

const completedCount = computed(() => props.visibleWords.slice(0, questionIndex.value).length)
const isComplete = computed(
  () => answerSegments.value.length > 0 && lockedSegments.value.every(Boolean),
)

function focusStage() {
  nextTick(() => {
    if (spellingInput.value) {
      spellingInput.value.focus()
      resetMobileInput()
      return
    }

    spellingStage.value?.focus()
  })
}

function resetMobileInput(target = spellingInput.value) {
  mobileInputValue.value = mobileInputSentinel

  nextTick(() => {
    if (!target) {
      return
    }

    target.value = mobileInputSentinel
    target.setSelectionRange?.(mobileInputSentinel.length, mobileInputSentinel.length)
  })
}

function markMobileBeforeInputHandled() {
  didHandleMobileBeforeInput.value = true
  mobileBeforeInputIgnoreUntil = Date.now() + 100

  if (mobileBeforeInputResetTimer !== null) {
    clearTimeout(mobileBeforeInputResetTimer)
  }

  mobileBeforeInputResetTimer = setTimeout(() => {
    didHandleMobileBeforeInput.value = false
    mobileBeforeInputResetTimer = null
  }, 0)
}

function consumeMobileBeforeInputHandled() {
  if (!didHandleMobileBeforeInput.value && Date.now() > mobileBeforeInputIgnoreUntil) {
    return false
  }

  didHandleMobileBeforeInput.value = false
  mobileBeforeInputIgnoreUntil = 0

  if (mobileBeforeInputResetTimer !== null) {
    clearTimeout(mobileBeforeInputResetTimer)
    mobileBeforeInputResetTimer = null
  }

  return true
}

function applyMobileTextInput(text) {
  Array.from(text).forEach((character) => {
    if (character === ' ') {
      handleSpace()
      return
    }

    appendCharacter(character)
  })
}

function firstEditableIndex(startIndex = 0, direction = 1) {
  if (!answerSegments.value.length) {
    return 0
  }

  let index = startIndex

  while (index >= 0 && index < answerSegments.value.length) {
    if (!lockedSegments.value[index]) {
      return index
    }

    index += direction
  }

  return activeSegmentIndex.value
}

function resetQuestion() {
  inputs.value = answerSegments.value.map(() => '')
  resetMobileInput()
  lockedSegments.value = answerSegments.value.map(() => false)
  segmentStatuses.value = answerSegments.value.map(() => 'idle')
  activeSegmentIndex.value = firstEditableIndex(0)
  shouldFocusFirstError.value = false
  isAnswerShown.value = false
  wrongSubmitCount.value = 0
  lastWrongSubmissionKey.value = ''
  focusStage()
}

function enterCurrentQuestion() {
  resetQuestion()

  if (currentWord.value) {
    playPronunciation(currentWord.value.word)
  }
}

function firstErrorIndex() {
  return segmentStatuses.value.findIndex((status, index) => status === 'error' && !lockedSegments.value[index])
}

function markAnswerChanged() {
  lastWrongSubmissionKey.value = ''
}

function activateSegment(index) {
  activeSegmentIndex.value = index
  shouldFocusFirstError.value = false

  if (segmentStatuses.value[index] === 'error') {
    inputs.value[index] = ''
    segmentStatuses.value[index] = 'retrying'
    markAnswerChanged()
  }
}

function moveToNextEditable() {
  if (shouldFocusFirstError.value) {
    const errorIndex = firstErrorIndex()

    if (errorIndex !== -1) {
      activateSegment(errorIndex)
      return
    }
  }

  activateSegment(firstEditableIndex(activeSegmentIndex.value + 1))
}

function moveToPreviousEditable() {
  activateSegment(firstEditableIndex(activeSegmentIndex.value - 1, -1))
}

function clearSegmentError(index) {
  if (segmentStatuses.value[index] === 'error') {
    segmentStatuses.value[index] = 'idle'
  }
}

function updateRetryStatus(index) {
  if (!['retrying', 'retry-complete'].includes(segmentStatuses.value[index])) {
    return
  }

  const inputLength = (inputs.value[index] ?? '').trim().length
  const answerLength = answerSegments.value[index]?.length ?? 0
  segmentStatuses.value[index] = inputLength >= answerLength ? 'retry-complete' : 'retrying'
}

function getWordWidth(word) {
  const letterWidths = {
    w: 1.5,
    m: 1.5,
    s: 0.8,
    t: 0.7,
    r: 0.7,
    f: 0.7,
    j: 0.6,
    i: 0.5,
    l: 0.5,
    u: 1.1,
    o: 1.1,
    p: 1.1,
    q: 1.1,
    n: 1.1,
    h: 1.1,
    g: 1.1,
    d: 1.1,
    b: 1.1,
    z: 0.9,
    y: 0.9,
    x: 0.9,
    v: 0.9,
    c: 0.9,
    "'": 0.5,
  }

  return word
    .toLowerCase()
    .split('')
    .reduce((totalWidth, letter) => totalWidth + (letterWidths[letter] || 1), 1)
}

function inputWidth(segment, index) {
  return Math.max(getWordWidth(segment), getWordWidth(inputs.value[index] ?? ''))
}

function normalizeAnswerText(text) {
  return text.trim().toLowerCase()
}

function isSegmentCorrect(input, segment) {
  return normalizeAnswerText(input) === normalizeAnswerText(segment)
}

function isCharacterCorrect(input, segment, characterIndex) {
  return input?.toLowerCase() === segment[characterIndex]?.toLowerCase()
}

function displayedCharacters(segment, index) {
  const answerCharacters = Array.from(segment)
  const inputCharacters = Array.from(inputs.value[index] ?? '')
  const characterCount = Math.max(answerCharacters.length, inputCharacters.length)

  return Array.from({ length: characterCount }, (_, characterIndex) => answerCharacters[characterIndex] ?? '')
}

function isLastEditableSegment(index = activeSegmentIndex.value) {
  return firstEditableIndex(index + 1) === index
}

function handleSpace() {
  if (isComplete.value) {
    goToNextQuestion()
    return
  }

  if (shouldFocusFirstError.value) {
    const errorIndex = firstErrorIndex()

    if (errorIndex !== -1) {
      activateSegment(errorIndex)
      playTypingSound()
      return
    }
  }

  playTypingSound()

  if (isLastEditableSegment()) {
    submitAnswer()
    return
  }

  moveToNextEditable()
}

function appendCharacter(character) {
  const index = activeSegmentIndex.value
  shouldFocusFirstError.value = false

  if (lockedSegments.value[index]) {
    moveToNextEditable()
    return
  }

  if (segmentStatuses.value[index] === 'error') {
    inputs.value[index] = character
    segmentStatuses.value[index] = 'retrying'
    markAnswerChanged()
    updateRetryStatus(index)
    playTypingSound()
    return
  }

  inputs.value[index] = `${inputs.value[index] ?? ''}${character}`
  markAnswerChanged()
  updateRetryStatus(index)
  playTypingSound()
}

function deleteCharacter() {
  if (shouldFocusFirstError.value) {
    const errorIndex = firstErrorIndex()

    if (errorIndex !== -1) {
      activateSegment(errorIndex)
      playTypingSound()
      return
    }
  }

  const index = activeSegmentIndex.value
  shouldFocusFirstError.value = false

  if (lockedSegments.value[index]) {
    moveToPreviousEditable()
    return
  }

  if (inputs.value[index]) {
    inputs.value[index] = inputs.value[index].slice(0, -1)
    markAnswerChanged()
    clearSegmentError(index)
    updateRetryStatus(index)
    playTypingSound()
    return
  }

  moveToPreviousEditable()

  const previousIndex = activeSegmentIndex.value

  if (!lockedSegments.value[previousIndex] && inputs.value[previousIndex]) {
    inputs.value[previousIndex] = inputs.value[previousIndex].slice(0, -1)
    markAnswerChanged()
    clearSegmentError(previousIndex)
    updateRetryStatus(previousIndex)
    playTypingSound()
  }
}

function goToNextQuestion() {
  if (questionIndex.value < props.visibleWords.length - 1) {
    questionIndex.value += 1
  }
}

function goToPreviousQuestion() {
  if (questionIndex.value > 0) {
    questionIndex.value -= 1
  } else {
    questionIndex.value = Math.max(props.visibleWords.length - 1, 0)
  }
}

function playCurrentPronunciation() {
  if (currentWord.value) {
    playPronunciation(currentWord.value.word)
  }
}

function showAnswer() {
  isAnswerShown.value = !isAnswerShown.value
  wrongSubmitCount.value = 0
  markAnswerChanged()
  focusStage()
}

function hideAnswer(event) {
  if (event?.target?.closest?.('.spelling-action')) {
    return
  }

  isAnswerShown.value = false
  focusStage()
}

function submitAnswer() {
  const submissionKey = answerSegments.value
    .map((_, index) => (lockedSegments.value[index] ? '<locked>' : inputs.value[index] ?? ''))
    .join('\u0000')

  if (submissionKey === lastWrongSubmissionKey.value) {
    return
  }

  answerSegments.value.forEach((segment, index) => {
    if (lockedSegments.value[index]) {
      return
    }

    if (isSegmentCorrect(inputs.value[index] ?? '', segment)) {
      inputs.value[index] = segment
      lockedSegments.value[index] = true
      segmentStatuses.value[index] = 'locked'
    } else {
      segmentStatuses.value[index] = 'error'
    }
  })

  if (lockedSegments.value.every(Boolean)) {
    shouldFocusFirstError.value = false
    isAnswerShown.value = false
    wrongSubmitCount.value = 0
    lastWrongSubmissionKey.value = ''
    playRightSound()
    playCurrentPronunciation()
    return
  }

  lastWrongSubmissionKey.value = submissionKey
  wrongSubmitCount.value += 1
  if (wrongSubmitCount.value >= 3) {
    isAnswerShown.value = true
  }
  playErrorSound()
  shouldFocusFirstError.value = true
  activeSegmentIndex.value = firstEditableIndex(0)
}

function handleKeydown(event) {
  if (!currentWord.value) {
    return
  }

  if (event.ctrlKey && event.key === ';') {
    event.preventDefault()
    showAnswer()
    return
  }

  if (event.ctrlKey && event.key === "'") {
    event.preventDefault()
    playCurrentPronunciation()
    return
  }

  if (event.ctrlKey && event.key === ',') {
    event.preventDefault()
    if (questionIndex.value > 0) {
      goToPreviousQuestion()
    }
    return
  }

  if (event.ctrlKey && event.key === '.') {
    event.preventDefault()
    if (questionIndex.value < props.visibleWords.length - 1) {
      goToNextQuestion()
    }
    return
  }

  if (isComplete.value) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      goToNextQuestion()
    }
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    handleSpace()
    return
  }

  if (event.key === 'Backspace') {
    event.preventDefault()
    deleteCharacter()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    submitAnswer()
    return
  }

  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    appendCharacter(event.key)
  }
}

function handleSpellingInput(event) {
  const value = event.target.value

  if (consumeMobileBeforeInputHandled()) {
    resetMobileInput(event.target)
    return
  }

  if (!currentWord.value) {
    resetMobileInput(event.target)
    return
  }

  if (value.length < mobileInputSentinel.length || !value.startsWith(mobileInputSentinel)) {
    deleteCharacter()
    resetMobileInput(event.target)
    return
  }

  const typedText = value.slice(mobileInputSentinel.length)

  if (!typedText) {
    resetMobileInput(event.target)
    return
  }

  applyMobileTextInput(typedText)
  resetMobileInput(event.target)
}

function handleSpellingBeforeInput(event) {
  if (!currentWord.value) {
    return
  }

  const inputType = event.inputType

  if (inputType?.startsWith('delete')) {
    event.preventDefault()
    markMobileBeforeInputHandled()
    deleteCharacter()
    resetMobileInput(event.target)
    return
  }

  if (inputType?.startsWith('insert') && inputType !== 'insertLineBreak' && event.data !== null) {
    event.preventDefault()
    markMobileBeforeInputHandled()
    applyMobileTextInput(event.data)
    resetMobileInput(event.target)
    return
  }

  if (inputType === 'insertLineBreak') {
    event.preventDefault()
    markMobileBeforeInputHandled()

    if (isComplete.value) {
      goToNextQuestion()
      resetMobileInput(event.target)
      return
    }

    submitAnswer()
    resetMobileInput(event.target)
  }
}

function handleSpellingInputKeydown(event) {
  if (!currentWord.value) {
    return
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    handleKeydown(event)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()

    if (isComplete.value) {
      goToNextQuestion()
      return
    }

    submitAnswer()
  }
}

watch(
  () => props.visibleWords,
  () => {
    questionIndex.value = 0
    enterCurrentQuestion()
  },
)

watch(questionIndex, enterCurrentQuestion)

onMounted(() => {
  preloadSoundEffects()
  enterCurrentQuestion()
})
</script>

<template>
  <section
    ref="spellingStage"
    class="relative grid h-full min-h-0 overflow-hidden p-3 outline-none md:h-auto md:min-h-[550px] md:p-11"
    tabindex="0"
    aria-label="单词拼写练习"
    @click="hideAnswer"
    @keydown="handleKeydown"
  >
    <input
      ref="spellingInput"
      :value="mobileInputValue"
      class="absolute bottom-24 left-1/2 z-0 size-px border-0 bg-transparent p-0 text-transparent opacity-[0.01] outline-none caret-transparent"
      type="text"
      inputmode="text"
      autocomplete="off"
      autocapitalize="none"
      spellcheck="false"
      enterkeyhint="done"
      aria-label="拼写输入"
      @beforeinput="handleSpellingBeforeInput"
      @input="handleSpellingInput"
      @keydown.stop="handleSpellingInputKeydown"
    />

    <div v-if="isLoading" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">正在翻开单词本...</div>
    <div v-else-if="errorMessage" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">{{ errorMessage }}</div>
    <div v-else-if="!visibleWords.length" class="relative z-[1] grid min-h-[470px] place-items-center text-lg font-bold text-[#4c7047]">这个单词本还没有可拼写的内容</div>

    <div v-else class="relative m-auto grid h-full min-h-0 w-full max-w-[720px] content-center justify-items-center overflow-hidden rounded-xl border-[1.5px] border-[rgba(83,112,67,0.48)] px-3 pt-[46px] pb-[100px] text-[#203725] [background:linear-gradient(180deg,rgba(255,253,235,0.92),rgba(250,239,197,0.84)),radial-gradient(ellipse_at_20%_8%,rgba(255,255,255,0.75),transparent_36%)] shadow-[0_22px_45px_rgba(57,77,46,0.18),inset_0_2px_0_rgba(255,255,255,0.58),inset_0_-8px_20px_rgba(161,132,62,0.08)] after:absolute after:right-[22px] after:bottom-[76px] after:h-[46px] after:w-[72px] after:bg-[radial-gradient(ellipse_at_24%_54%,rgba(210,155,54,0.42)_0_18%,transparent_19%),radial-gradient(ellipse_at_54%_48%,rgba(96,139,78,0.42)_0_22%,transparent_23%),radial-gradient(ellipse_at_80%_60%,rgba(77,122,76,0.35)_0_15%,transparent_16%)] after:opacity-55 after:content-[''] md:h-auto md:min-h-[520px] md:max-w-[960px] md:px-[42px] md:pt-[92px] md:pb-[108px]">
      <div class="absolute top-[18px] right-[18px] z-[1] select-none font-[family-name:var(--english-font)] text-sm leading-none font-bold tracking-normal text-[#6f5b25] md:top-6 md:right-7 md:text-base" aria-label="拼写进度">{{ progressLabel }}</div>
      <div v-if="isComplete" class="relative z-[1] grid max-w-[min(760px,100%)] justify-items-center gap-[22px] text-center md:gap-[26px]" aria-live="polite">
        <div class="[overflow-wrap:anywhere] font-[family-name:var(--english-font)] text-5xl leading-[1.08] font-bold tracking-normal text-[#275238] md:text-6xl md:leading-[1.04]">{{ currentWord.word }}</div>
        <div class="[overflow-wrap:anywhere] font-[family-name:var(--chinese-font)] text-2xl leading-[1.25] font-bold tracking-normal text-[#8b5a18] md:text-[40px] md:leading-[1.2]">{{ currentWord.meaning }}</div>
      </div>

      <p v-else class="relative z-[1] mb-[34px] max-w-[min(760px,100%)] font-[family-name:var(--chinese-font)] text-3xl leading-[1.25] font-bold text-[#233f2b] text-center md:mb-11 md:text-[40px]">{{ currentWord.meaning }}</p>

      <div v-if="!isComplete" class="relative z-[1] flex w-full flex-wrap justify-center gap-x-2 gap-y-3.5 md:gap-x-[9px] md:gap-y-4" aria-live="polite">
        <span
          v-for="(segment, index) in answerSegments"
          :key="`${currentWord.id}-${index}`"
          class="grid min-h-[58px] shrink-0 grow-0 basis-auto items-end border-b-[3px] border-[rgba(110,132,86,0.42)] px-1.5 pb-[9px] text-center font-[family-name:var(--english-font)] text-4xl leading-none font-medium text-[#5e6e60] md:min-h-[66px] md:px-2.5 md:text-5xl"
          :style="{ minWidth: `${inputWidth(segment, index)}ch` }"
          :class="[
            index === activeSegmentIndex &&
            !lockedSegments[index] &&
            segmentStatuses[index] !== 'error'
              ? '!border-[#d9962c] !text-[#d08921]'
              : '',
            segmentStatuses[index] === 'error' ? '!border-[#c65a45] !text-[#b94d39]' : '',
            segmentStatuses[index] === 'answer'
              ? '!border-[rgba(110,132,86,0.42)] !text-[#5e6e60]'
              : '',
            isAnswerShown && !lockedSegments[index]
              ? '!border-[#d5a24a]'
              : '',
            index !== activeSegmentIndex && segmentStatuses[index] === 'retry-complete'
              ? '!border-[#5d9c83] !text-[#4f8873]'
              : '',
            lockedSegments[index]
              ? '!border-[rgba(104,137,79,0.38)] !text-[#6f8a52]'
              : '',
          ]"
        >
          <span v-if="isAnswerShown && !lockedSegments[index]" class="flex min-w-[1ch] justify-center [overflow-wrap:normal] whitespace-nowrap" :aria-label="`答案提示：${segment}`">
            <span
              v-for="(character, characterIndex) in displayedCharacters(segment, index)"
              :key="`${currentWord.id}-${index}-${characterIndex}`"
              :class="[
                !inputs[index]?.[characterIndex]
                  ? 'text-[#a8afa1]'
                  : isCharacterCorrect(inputs[index][characterIndex], segment, characterIndex)
                    ? '!text-[#d08921]'
                    : '!text-[#b94d39]',
              ]"
            >{{ inputs[index]?.[characterIndex] || character }}</span>
          </span>
          <span v-else class="block min-w-[1ch] [overflow-wrap:normal] whitespace-nowrap">
            {{ inputs[index] || (index === activeSegmentIndex ? '' : '\u00a0') }}
          </span>
        </span>
      </div>

      <div class="absolute right-0 bottom-3 left-0 z-[2] grid min-h-[58px] grid-cols-[42px_minmax(0,1fr)_42px] items-center px-1.5 font-[family-name:var(--english-font)] text-[#315038] md:bottom-[18px] md:grid-cols-[56px_minmax(0,1fr)_56px] md:px-[18px]" aria-label="拼写练习控制">
        <button
          v-if="questionIndex > 0"
          class="grid size-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-[rgba(58,87,55,0.58)] transition-[color,background-color,border-color,box-shadow] duration-140 hover:bg-[rgba(255,248,213,0.62)] hover:text-[#284d32]"
          type="button"
          aria-label="上一个，快捷键 Ctrl 加逗号"
          title="Ctrl + ,"
          @click="goToPreviousQuestion"
        >
          <ChevronLeft :size="22" :stroke-width="1.8" />
        </button>
        <span v-else class="grid size-[34px] place-items-center rounded-full border-0 bg-transparent p-0 text-[rgba(58,87,55,0.58)]" aria-hidden="true"></span>

        <div class="flex flex-wrap items-center justify-center gap-2.5 md:gap-x-[34px] md:gap-y-[18px]">
          <button class="spelling-action inline-flex min-h-[34px] min-w-[74px] cursor-pointer items-center justify-center gap-0 rounded-[8px_7px_9px_7px] border border-transparent bg-transparent px-2.5 py-1.5 text-sm leading-none font-medium text-[#3f5c43] shadow-none transition-[color,background-color,border-color,box-shadow] duration-140 hover:bg-[rgba(255,248,213,0.62)] hover:text-[#284d32] md:min-w-0 md:gap-1" type="button" :aria-pressed="isAnswerShown" @click="showAnswer">
            <kbd class="hidden h-[22px] min-w-[27px] rounded-[6px_5px_7px_5px] border border-[rgba(108,130,85,0.36)] bg-[rgba(255,253,235,0.86)] px-[7px] py-0.5 text-center font-[family-name:var(--english-font)] text-xs leading-4 font-semibold text-[#4a5939] shadow-[inset_0_-1px_0_rgba(139,118,62,0.12),0_1px_1px_rgba(45,63,39,0.05)] md:block">Ctrl</kbd>
            <kbd class="hidden h-[22px] min-w-[27px] rounded-[6px_5px_7px_5px] border border-[rgba(108,130,85,0.36)] bg-[rgba(255,253,235,0.86)] px-[7px] py-0.5 text-center font-[family-name:var(--english-font)] text-xs leading-4 font-semibold text-[#4a5939] shadow-[inset_0_-1px_0_rgba(139,118,62,0.12),0_1px_1px_rgba(45,63,39,0.05)] md:block">;</kbd>
            <span class="relative top-px inline-flex h-[22px] items-center leading-none">{{ isAnswerShown ? '隐藏答案' : '显示答案' }}</span>
          </button>
          <button class="inline-flex min-h-[34px] min-w-[74px] cursor-pointer items-center justify-center gap-0 rounded-[8px_7px_9px_7px] border border-transparent bg-transparent px-2.5 py-1.5 text-sm leading-none font-medium text-[#3f5c43] shadow-none transition-[color,background-color,border-color,box-shadow] duration-140 hover:bg-[rgba(255,248,213,0.62)] hover:text-[#284d32] md:min-w-0 md:gap-1" type="button" @click="playCurrentPronunciation">
            <kbd class="hidden h-[22px] min-w-[27px] rounded-[6px_5px_7px_5px] border border-[rgba(108,130,85,0.36)] bg-[rgba(255,253,235,0.86)] px-[7px] py-0.5 text-center font-[family-name:var(--english-font)] text-xs leading-4 font-semibold text-[#4a5939] shadow-[inset_0_-1px_0_rgba(139,118,62,0.12),0_1px_1px_rgba(45,63,39,0.05)] md:block">Ctrl</kbd>
            <kbd class="hidden h-[22px] min-w-[27px] rounded-[6px_5px_7px_5px] border border-[rgba(108,130,85,0.36)] bg-[rgba(255,253,235,0.86)] px-[7px] py-0.5 text-center font-[family-name:var(--english-font)] text-xs leading-4 font-semibold text-[#4a5939] shadow-[inset_0_-1px_0_rgba(139,118,62,0.12),0_1px_1px_rgba(45,63,39,0.05)] md:block">'</kbd>
            <span class="relative top-px inline-flex h-[22px] items-center leading-none">播放发音</span>
          </button>
        </div>

        <button
          v-if="questionIndex < visibleWords.length - 1"
          class="grid size-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-[rgba(58,87,55,0.58)] transition-[color,background-color,border-color,box-shadow] duration-140 hover:bg-[rgba(255,248,213,0.62)] hover:text-[#284d32]"
          type="button"
          aria-label="下一个，快捷键 Ctrl 加句号"
          title="Ctrl + ."
          @click="goToNextQuestion"
        >
          <ChevronRight :size="22" :stroke-width="1.8" />
        </button>
        <span v-else class="grid size-[34px] place-items-center rounded-full border-0 bg-transparent p-0 text-[rgba(58,87,55,0.58)]" aria-hidden="true"></span>
      </div>
    </div>
  </section>
</template>
