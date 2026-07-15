import assert from 'node:assert/strict'
import test from 'node:test'
import { createBookAssetPath, loadBookArticle, validateArticle } from './articles.js'

const validArticle = {
  title: 'A Wise Father?',
  highlightWords: ['wise'],
  paragraphs: [
    {
      english: 'It is a wise father.',
      chinese: '这是一位明智的父亲。',
    },
  ],
}

test('builds vocabulary and article paths from the shared book folder', () => {
  const book = { folder: 'postgraduate' }

  assert.equal(
    createBookAssetPath(book, 'article-001-a-wise-father.json'),
    '/books/postgraduate/article-001-a-wise-father.json',
  )
})

test('accepts bilingual paragraph pairs', () => {
  assert.equal(validateArticle(validArticle, 'article.json'), validArticle)
})

test('reports the article filename and paragraph number for invalid paragraphs', () => {
  assert.throws(
    () =>
      validateArticle(
        {
          title: 'Broken article',
          highlightWords: [],
          paragraphs: [{ english: '', chinese: '译文' }],
        },
        'broken.json',
      ),
    /broken\.json.*english/,
  )
})

test('requires highlightWords to be an array of words', () => {
  assert.throws(
    () => validateArticle({ ...validArticle, highlightWords: ['wise', ''] }, 'broken.json'),
    /broken\.json.*highlightWords/,
  )
})

test('loads the requested article file in article_files order', async () => {
  const originalFetch = globalThis.fetch
  let requestedPath = ''

  globalThis.fetch = async (path) => {
    requestedPath = path
    return {
      ok: true,
      json: async () => validArticle,
    }
  }

  try {
    const article = await loadBookArticle(
      {
        folder: 'postgraduate',
        article_files: ['article-001-a-wise-father.json'],
      },
      0,
    )

    assert.equal(requestedPath, '/books/postgraduate/article-001-a-wise-father.json')
    assert.equal(article.title, 'A Wise Father?')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('returns null when a book has no article at the requested index', async () => {
  assert.equal(await loadBookArticle({ folder: 'postgraduate', article_files: [] }), null)
})
