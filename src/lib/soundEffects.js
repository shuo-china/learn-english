const SOUND_PATHS = {
  error: '/assets/sounds/error.mp3',
  right: '/assets/sounds/right.mp3',
  typing: '/assets/sounds/typing.mp3',
}

const PLAY_INTERVAL_TIME = 60
let lastTypingPlayTime = 0
let errorAudio = null
let rightAudio = null
let audioContext = null
let typingAudioBuffer = null
let typingAudioLoadPromise = null

function createAudio(path) {
  if (typeof Audio === 'undefined') {
    return null
  }

  const audio = new Audio(path)
  audio.preload = 'auto'
  return audio
}

async function loadTypingAudioBuffer() {
  if (typingAudioBuffer || typingAudioLoadPromise) {
    return typingAudioLoadPromise
  }

  if (typeof AudioContext === 'undefined') {
    return null
  }

  audioContext ??= new AudioContext()
  typingAudioLoadPromise = fetch(SOUND_PATHS.typing)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      typingAudioBuffer = audioBuffer
      return audioBuffer
    })
    .catch((error) => {
      typingAudioLoadPromise = null
      console.warn(error)
      return null
    })

  return typingAudioLoadPromise
}

function playAudio(audio) {
  if (!audio) {
    return
  }

  try {
    audio.currentTime = 0
    audio.play().catch((error) => console.warn(error))
  } catch (error) {
    console.warn(error)
  }
}

export function preloadSoundEffects() {
  errorAudio ??= createAudio(SOUND_PATHS.error)
  rightAudio ??= createAudio(SOUND_PATHS.right)
  loadTypingAudioBuffer()
}

export function playTypingSound() {
  const now = Date.now()

  if (now - lastTypingPlayTime < PLAY_INTERVAL_TIME) {
    return
  }

  lastTypingPlayTime = now

  if (!audioContext || !typingAudioBuffer) {
    loadTypingAudioBuffer()
    return
  }

  const source = audioContext.createBufferSource()
  source.buffer = typingAudioBuffer
  source.connect(audioContext.destination)
  source.start()
  source.onended = () => {
    source.disconnect()
  }
}

export function playErrorSound() {
  preloadSoundEffects()
  playAudio(errorAudio)
}

export function playRightSound() {
  preloadSoundEffects()
  playAudio(rightAudio)
}
