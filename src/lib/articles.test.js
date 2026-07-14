import assert from 'node:assert/strict'
import test from 'node:test'
import { createBookAssetPath, loadBookArticle, validateArticle } from './articles.js'

const validArticle = {
  title: 'A Wise Father?',
  paragraphs: [
    {
      content: ['It is a ', { text: 'wise', meaning: '明智的' }, ' father.'],
      translation: '这是一位明智的父亲。',
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

test('accepts paragraphs without ids and annotated terms without parts of speech', () => {
  assert.equal(validateArticle(validArticle, 'article.json'), validArticle)
})

test('reports the article filename and paragraph number for invalid content', () => {
  assert.throws(
    () =>
      validateArticle(
        {
          title: 'Broken article',
          paragraphs: [{ content: [{ text: 'wise' }], translation: '译文' }],
        },
        'broken.json',
      ),
    /broken\.json 格式错误：第 1 段第 1 个 content 项/,
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
