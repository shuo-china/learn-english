export function parseVocabularyText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const match = line.match(/^(?:! ([^ ].*?)|(?![-*] )([^! ].*?)) \| (.+)$/)

      if (!match) {
        return null
      }

      const wordText = (match[1] || match[2]).trim()

      return {
        id: `${index}-${wordText.toLowerCase().replace(/\s+/g, '-')}`,
        word: wordText,
        meaning: match[3].trim(),
        isKey: Boolean(match[1]),
        revealed: false,
      }
    })
    .filter(Boolean)
}

export async function loadBooksIndex(path = '/books/index.json') {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error('无法读取单词本清单')
  }

  return response.json()
}

export async function loadVocabularyWords(book) {
  const response = await fetch(`/books/${book.file}`)

  if (!response.ok) {
    throw new Error(`无法读取 ${book.title}`)
  }

  return parseVocabularyText(await response.text())
}

export function createShuffledWordIds(items) {
  const ids = items.map((item) => item.id)

  for (let index = ids.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]]
  }

  return ids
}
