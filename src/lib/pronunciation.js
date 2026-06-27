let activeAudio = null
let pronunciationRequestId = 0

export function createYoudaoDictionaryUrl(text, type = 2) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`
}

export function playPronunciation(text) {
  if (!text) {
    return
  }

  const pronunciationTypes = [2, 1]
  let typeIndex = 0
  const requestId = ++pronunciationRequestId

  const playType = () => {
    if (requestId !== pronunciationRequestId) {
      return
    }

    try {
      if (activeAudio) {
        activeAudio.pause()
      }

      const audio = new Audio(createYoudaoDictionaryUrl(text, pronunciationTypes[typeIndex]))
      let isFallbackStarted = false

      const fallback = (error) => {
        if (isFallbackStarted) {
          return
        }

        isFallbackStarted = true
        typeIndex += 1

        if (requestId !== pronunciationRequestId) {
          return
        }

        if (typeIndex < pronunciationTypes.length) {
          playType()
        } else if (error) {
          console.warn(error)
        }
      }

      audio.addEventListener('error', fallback, { once: true })
      activeAudio = audio
      audio.play().catch(fallback)
    } catch (error) {
      console.warn(error)
    }
  }

  playType()
}
