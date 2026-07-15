import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('keeps an incorrect active spelling segment red until retry starts', () => {
  const component = readFileSync(new URL('../views/SpellingPage.vue', import.meta.url), 'utf8')

  assert.match(component, /segmentStatuses\[index\] !== 'error'/)
  assert.match(component, /segmentStatuses\[index\] === 'error'[\s\S]*!text-\[#b94d39\]/)
})
