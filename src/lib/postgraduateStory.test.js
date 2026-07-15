import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { validateArticle } from './articles.js'

const root = path.resolve(import.meta.dirname, '..', '..')
const bookDir = path.join(root, 'public', 'books', 'postgraduate')

test('postgraduate book has ten valid bilingual articles', async () => {
  const books = JSON.parse(await readFile(path.join(root, 'public', 'books', 'index.json'), 'utf8'))
  const book = books.find(({ folder }) => folder === 'postgraduate')
  assert.equal(book.article_files.length, 10)
  assert.deepEqual(
    book.article_files,
    book.article_files.slice().sort(),
    'chapters must remain in reading order',
  )

  for (const file of book.article_files) {
    const article = JSON.parse(await readFile(path.join(bookDir, file), 'utf8'))
    validateArticle(article, file)
    assert.ok(Array.isArray(article.highlightWords))
    assert.ok(article.paragraphs.length >= 3)
    for (const paragraph of article.paragraphs) {
      assert.equal(typeof paragraph.english, 'string')
      assert.ok(paragraph.english.trim())
      assert.equal(typeof paragraph.chinese, 'string')
      assert.ok(paragraph.chinese.trim())
    }
  }
})
