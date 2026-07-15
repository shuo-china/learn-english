import { fetchJson } from './fetchResource.js'

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

  if (!Array.isArray(article.highlightWords) || article.highlightWords.some((word) => typeof word !== 'string' || !word.trim())) {
    throw articleFormatError(fileName, 'highlightWords must be an array of non-empty strings')
  }

  if (!Array.isArray(article.paragraphs) || !article.paragraphs.length) {
    throw articleFormatError(fileName, 'paragraphs 必须包含至少一个段落')
  }

  article.paragraphs.forEach((paragraph, paragraphIndex) => {
    const location = `第 ${paragraphIndex + 1} 段`

    if (!paragraph || typeof paragraph !== 'object' || Array.isArray(paragraph)) {
      throw articleFormatError(fileName, `${location}必须是对象`)
    }

    if (typeof paragraph.english !== 'string' || !paragraph.english.trim()) {
      throw articleFormatError(fileName, `${location}缺少 english`)
    }

    if (typeof paragraph.chinese !== 'string' || !paragraph.chinese.trim()) {
      throw articleFormatError(fileName, `${location}缺少 chinese`)
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

export async function loadBookArticle(book, articleIndex = 0, articleFiles = book?.article_files) {
  const fileName = articleFiles?.[articleIndex]

  if (!fileName) {
    return null
  }

  const article = await fetchJson(createBookAssetPath(book, fileName), {
    errorMessage: `无法读取文章 ${fileName}`,
    invalidJsonMessage: articleFormatError(fileName, '不是有效的 JSON').message,
  })

  return validateArticle(article, fileName)
}
