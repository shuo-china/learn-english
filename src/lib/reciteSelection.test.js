import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { clearReciteSelection } from './reciteSelection.js'

test('allows selecting English words but not Chinese meanings', () => {
  const component = readFileSync(new URL('../views/RecitePage.vue', import.meta.url), 'utf8')

  assert.match(component, /<span[\s\S]*class="[^"]*select-text[^"]*"/)
  assert.match(component, /<button[\s\S]*class="[^"]*select-none[^"]*"/)
})

test('binds reveal toggling to a native Chinese meaning button instead of the whole row', () => {
  const component = readFileSync(new URL('../views/RecitePage.vue', import.meta.url), 'utf8')
  const rowTag = component.match(/<div\s+v-for="word in visibleWords"[\s\S]*?>/)?.[0] ?? ''
  const wordTextTag = component.match(/<span\s+[\s\S]*?select-text[\s\S]*?>/)?.[0] ?? ''
  const meaningCellTag = component.match(/<button\s+[\s\S]*?select-none[\s\S]*?>/)?.[0] ?? ''

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

  clearReciteSelection(selection)

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

  clearReciteSelection(selection)

  assert.equal(removeCount, 0)
})

test('ignores missing or partial Selection APIs', () => {
  assert.doesNotThrow(() => clearReciteSelection())
  assert.doesNotThrow(() => clearReciteSelection({ toString: () => 'recite' }))
  assert.doesNotThrow(() => clearReciteSelection({ toString: () => { throw new Error('selection detached') } }))
})
