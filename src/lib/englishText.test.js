import assert from 'node:assert/strict'
import test from 'node:test'

import { splitEnglishWords } from './englishText.js'

test('splits English words while retaining punctuation and curly apostrophes', () => {
  assert.deepEqual(splitEnglishWords("Don't stop—it's Jane’s book."), [
    { text: "Don't", isWord: true },
    { text: ' ', isWord: false },
    { text: 'stop', isWord: true },
    { text: '—', isWord: false },
    { text: "it's", isWord: true },
    { text: ' ', isWord: false },
    { text: 'Jane’s', isWord: true },
    { text: ' ', isWord: false },
    { text: 'book', isWord: true },
    { text: '.', isWord: false },
  ])
})
