<script setup>
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
  const selectionText = window.getSelection?.().toString()

  if (selectionText) {
    return
  }

  emit('word-click', wordId)
}
</script>

<template>
  <div class="word-paper">
    <div v-if="isLoading" class="empty-state">正在翻开单词本...</div>
    <div v-else-if="errorMessage" class="empty-state">{{ errorMessage }}</div>
    <div v-else-if="!visibleWords.length" class="empty-state">这个单词本还没有可背诵的内容</div>

    <div v-else class="word-list">
      <div
        v-for="word in visibleWords"
        :key="word.id"
        class="word-row"
        :class="{ revealed: word.revealed, key: word.isKey }"
        role="button"
        tabindex="0"
        @click="handleWordClick(word.id)"
        @keydown.enter.prevent="emit('word-click', word.id)"
        @keydown.space.prevent="emit('word-click', word.id)"
      >
        <span class="word-text">{{ word.word }}</span>
        <span class="meaning-cell">
          <span v-if="word.revealed" class="meaning-text">{{ word.meaning }}</span>
          <span v-else class="meaning-mask" aria-hidden="true"></span>
        </span>
      </div>
      <div class="word-list-meta" aria-live="polite">共 {{ words.length }} 个单词</div>
    </div>
  </div>
</template>
