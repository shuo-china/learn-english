const ENGLISH_WORD_PATTERN = "[A-Za-z]+(?:['’][A-Za-z]+)*"
const ENGLISH_WORD_SPLITTER = new RegExp(`(${ENGLISH_WORD_PATTERN})`, 'g')
const ENGLISH_WORD_MATCHER = new RegExp(`^${ENGLISH_WORD_PATTERN}$`)

export function splitEnglishWords(text) {
  return text.split(ENGLISH_WORD_SPLITTER).filter(Boolean).map((part) => ({
    text: part,
    isWord: ENGLISH_WORD_MATCHER.test(part),
  }))
}
