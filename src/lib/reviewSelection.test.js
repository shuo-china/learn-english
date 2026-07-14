import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { clearReviewSelection } from './reviewSelection.js'

test('allows selecting English words but not Chinese meanings', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8')

  assert.match(css, /\.word-text\s*{[^}]*user-select:\s*text;/s)
  assert.match(css, /\.meaning-cell\s*{[^}]*user-select:\s*none;/s)
})

test('binds reveal toggling to a native Chinese meaning button instead of the whole row', () => {
  const component = readFileSync(new URL('../views/ReviewPage.vue', import.meta.url), 'utf8')
  const rowTag = component.match(/<div\s+v-for="word in visibleWords"[\s\S]*?>/)?.[0] ?? ''
  const wordTextTag = component.match(/<span class="word-text"[\s\S]*?>/)?.[0] ?? ''
  const meaningCellTag = component.match(/<button\s+class="meaning-cell"[\s\S]*?>/)?.[0] ?? ''

  assert.doesNotMatch(rowTag, /@click=/)
  assert.doesNotMatch(wordTextTag, /@click=/)
  assert.match(meaningCellTag, /type="button"/)
  assert.match(meaningCellTag, /@click=/)
  assert.doesNotMatch(meaningCellTag, /@keydown/)
})

test('clears selected text after a meaning-cell click', () => {
  let removeCount = 0
  const selection = {
    toString: () => 'recite',
    removeAllRanges() {
      removeCount += 1
    },
  }

  clearReviewSelection(selection)

  assert.equal(removeCount, 1)
})

test('does not clear when there is no selected text', () => {
  let removeCount = 0
  const selection = {
    toString: () => '',
    removeAllRanges() {
      removeCount += 1
    },
  }

  clearReviewSelection(selection)

  assert.equal(removeCount, 0)
})

test('ignores missing or partial Selection APIs', () => {
  assert.doesNotThrow(() => clearReviewSelection())
  assert.doesNotThrow(() => clearReviewSelection({ toString: () => 'recite' }))
  assert.doesNotThrow(() => clearReviewSelection({ toString: () => { throw new Error('selection detached') } }))
})
