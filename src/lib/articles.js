function articleFormatError(fileName, detail) {
  return new Error(`${fileName} 格式错误：${detail}`)
}

export function validateArticle(article, fileName = '文章文件') {
  if (!article || typeof article !== 'object' || Array.isArray(article)) {
    throw articleFormatError(fileName, '内容必须是 JSON 对象')
  }

  if (typeof article.title !== 'string' || !article.title.trim()) {
    throw articleFormatError(fileName, '缺少文章标题')
  }

  if (!Array.isArray(article.paragraphs) || !article.paragraphs.length) {
    throw articleFormatError(fileName, 'paragraphs 必须包含至少一个段落')
  }

  article.paragraphs.forEach((paragraph, paragraphIndex) => {
    const location = `第 ${paragraphIndex + 1} 段`

    if (!paragraph || typeof paragraph !== 'object' || Array.isArray(paragraph)) {
      throw articleFormatError(fileName, `${location}必须是对象`)
    }

    if (!Array.isArray(paragraph.content) || !paragraph.content.length) {
      throw articleFormatError(fileName, `${location}的 content 必须包含正文`)
    }

    paragraph.content.forEach((part, partIndex) => {
      if (typeof part === 'string') {
        return
      }

      const isTerm =
        part &&
        typeof part === 'object' &&
        !Array.isArray(part) &&
        typeof part.text === 'string' &&
        part.text.trim() &&
        typeof part.meaning === 'string' &&
        part.meaning.trim()

      if (!isTerm) {
        throw articleFormatError(
          fileName,
          `${location}第 ${partIndex + 1} 个 content 项必须是字符串或包含 text、meaning 的对象`,
        )
      }
    })

    if (typeof paragraph.translation !== 'string' || !paragraph.translation.trim()) {
      throw articleFormatError(fileName, `${location}缺少 translation`)
    }
  })

  return article
}

export function createBookAssetPath(book, fileName) {
  if (!book?.folder || !fileName) {
    throw new Error('书籍资源路径不完整')
  }

  return `/books/${book.folder}/${fileName}`
}

export async function loadBookArticle(book, articleIndex = 0) {
  const fileName = book?.article_files?.[articleIndex]

  if (!fileName) {
    return null
  }

  const response = await fetch(createBookAssetPath(book, fileName))

  if (!response.ok) {
    throw new Error(`无法读取文章 ${fileName}`)
  }

  let article

  try {
    article = await response.json()
  } catch {
    throw articleFormatError(fileName, '不是有效的 JSON')
  }

  return validateArticle(article, fileName)
}
