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
})

const spellingStage = ref(null)
const questionIndex = ref(0)
const inputs = ref([])
const lockedSegments = ref([])
const segmentStatuses = ref([])
const activeSegmentIndex = ref(0)
const shouldFocusFirstError = ref(false)
const isAnswerShown = ref(false)
const wrongSubmitCount = ref(0)

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
    spellingStage.value?.focus()
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
  lockedSegments.value = answerSegments.value.map(() => false)
  segmentStatuses.value = answerSegments.value.map(() => 'idle')
  activeSegmentIndex.value = firstEditableIndex(0)
  shouldFocusFirstError.value = false
  isAnswerShown.value = false
  wrongSubmitCount.value = 0
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

function activateSegment(index) {
  activeSegmentIndex.value = index
  shouldFocusFirstError.value = false

  if (segmentStatuses.value[index] === 'error') {
    inputs.value[index] = ''
    segmentStatuses.value[index] = 'retrying'
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
    .toLocaleLowerCase()
    .split('')
    .reduce((totalWidth, letter) => totalWidth + (letterWidths[letter] || 1), 1)
}

function inputWidth(segment, index) {
  return Math.max(getWordWidth(segment), getWordWidth(inputs.value[index] ?? ''))
}

function normalizeAnswerText(text) {
  return text.trim().toLocaleLowerCase()
}

function isSegmentCorrect(input, segment) {
  return normalizeAnswerText(input) === normalizeAnswerText(segment)
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
    updateRetryStatus(index)
    playTypingSound()
    return
  }

  inputs.value[index] = `${inputs.value[index] ?? ''}${character}`
  updateRetryStatus(index)
  playTypingSound()
}

function deleteCharacter() {
  const index = activeSegmentIndex.value
  shouldFocusFirstError.value = false

  if (lockedSegments.value[index]) {
    moveToPreviousEditable()
    return
  }

  if (inputs.value[index]) {
    inputs.value[index] = inputs.value[index].slice(0, -1)
    clearSegmentError(index)
    updateRetryStatus(index)
    playTypingSound()
    return
  }

  moveToPreviousEditable()

  const previousIndex = activeSegmentIndex.value

  if (!lockedSegments.value[previousIndex] && inputs.value[previousIndex]) {
    inputs.value[previousIndex] = inputs.value[previousIndex].slice(0, -1)
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
  focusStage()
}

function hideAnswer(event) {
  if (event?.target?.closest?.('.answer-popover, .spelling-action')) {
    return
  }

  isAnswerShown.value = false
  focusStage()
}

function submitAnswer() {
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
    playRightSound()
    playCurrentPronunciation()
    return
  }

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
    class="spelling-paper"
    tabindex="0"
    aria-label="单词拼写练习"
    @click="hideAnswer"
    @keydown="handleKeydown"
  >
    <div v-if="isLoading" class="empty-state">正在翻开单词本...</div>
    <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
    <div v-else-if="!visibleWords.length" class="empty-state">这个单词本还没有可拼写的内容</div>

    <div v-else class="spelling-card">
      <div class="spelling-progress" aria-label="拼写进度">{{ progressLabel }}</div>
      <div v-if="isAnswerShown" class="answer-popover" role="dialog" aria-label="答案">
        <div class="answer-word">{{ currentWord.word }}</div>
      </div>

      <div v-if="isComplete" class="spelling-success" aria-live="polite">
        <div class="spelling-success-word">{{ currentWord.word }}</div>
        <div class="spelling-success-meaning">{{ currentWord.meaning }}</div>
      </div>

      <p v-else class="spelling-prompt">{{ currentWord.meaning }}</p>

      <div v-if="!isComplete" class="spelling-segments" aria-live="polite">
        <span
          v-for="(segment, index) in answerSegments"
          :key="`${currentWord.id}-${index}`"
          class="spell-segment"
          :style="{ minWidth: `${inputWidth(segment, index)}ch` }"
          :class="{
            active: index === activeSegmentIndex && !lockedSegments[index],
            error: segmentStatuses[index] === 'error',
            answer: segmentStatuses[index] === 'answer',
            retryComplete:
              index !== activeSegmentIndex && segmentStatuses[index] === 'retry-complete',
            locked: lockedSegments[index],
          }"
        >
          <span class="spell-text">
            {{ inputs[index] || (index === activeSegmentIndex ? '' : '\u00a0') }}
          </span>
        </span>
      </div>

      <div class="spelling-controls" aria-label="拼写练习控制">
        <button
          v-if="questionIndex > 0"
          class="spelling-arrow"
          type="button"
          aria-label="上一个，快捷键 Ctrl 加逗号"
          title="Ctrl + ,"
          @click="goToPreviousQuestion"
        >
          <ChevronLeft :size="22" :stroke-width="1.8" />
        </button>
        <span v-else class="spelling-arrow-placeholder" aria-hidden="true"></span>

        <div class="spelling-actions">
          <button class="spelling-action" type="button" @click="playCurrentPronunciation">
            <kbd>Ctrl</kbd>
            <kbd>'</kbd>
            <span>播放发音</span>
          </button>
          <button class="spelling-action" type="button" @click="showAnswer">
            <kbd>Ctrl</kbd>
            <kbd>;</kbd>
            <span>显示答案</span>
          </button>
        </div>

        <button
          v-if="questionIndex < visibleWords.length - 1"
          class="spelling-arrow"
          type="button"
          aria-label="下一个，快捷键 Ctrl 加句号"
          title="Ctrl + ."
          @click="goToNextQuestion"
        >
          <ChevronRight :size="22" :stroke-width="1.8" />
        </button>
        <span v-else class="spelling-arrow-placeholder" aria-hidden="true"></span>
      </div>
    </div>
  </section>
</template>
