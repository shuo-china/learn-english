import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..')

test('every book keeps its vocabulary and articles in one folder', async () => {
  const books = JSON.parse(
    await readFile(path.join(workspaceRoot, 'public', 'books', 'index.json'), 'utf8'),
  )

  assert.ok(books.length >= 3)

  for (const book of books) {
    assert.match(book.folder, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.equal(book.vocabulary_file, 'vocabulary.txt')

    const bookFolder = path.join(workspaceRoot, 'public', 'books', book.folder)
    const vocabulary = await readFile(path.join(bookFolder, book.vocabulary_file), 'utf8')
    assert.ok(vocabulary.trim())

    for (const articleFile of book.article_files) {
      assert.match(articleFile, /^article-\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\.json$/)
      const article = JSON.parse(await readFile(path.join(bookFolder, articleFile), 'utf8'))
      assert.ok(article.title)
    }
  }
})
