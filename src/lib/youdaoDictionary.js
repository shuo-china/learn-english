const YOUDAO_ENDPOINT = 'https://openapi.youdao.com/api'

function getRequiredEnv(name) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`缺少 ${name} 配置`)
  }
  return value
}

function truncateForSignature(text) {
  return text.length <= 20
    ? text
    : `${text.slice(0, 10)}${text.length}${text.slice(-10)}`
}

async function sha256(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createSalt() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function requestJsonp(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `youdaoDictionary_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    let settled = false

    const cleanup = () => {
      script.remove()
      delete window[callbackName]
      signal?.removeEventListener('abort', onAbort)
    }

    const finish = (callback) => (value) => {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }

    const onAbort = finish(() => reject(new DOMException('The operation was aborted.', 'AbortError')))

    window[callbackName] = finish(resolve)
    script.onerror = finish(() => reject(new Error('词典查询暂时不可用')))
    script.src = `${url}&callback=${encodeURIComponent(callbackName)}`

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
    document.head.append(script)
  })
}

export function normalizeYoudaoTranslation(response, word) {
  if (response?.errorCode !== '0') {
    throw new Error(response?.errorCode ? `词典查询失败（${response.errorCode}）` : '词典查询暂时不可用')
  }

  const meanings = response.basic?.explains?.filter(Boolean) ?? response.translation?.filter(Boolean) ?? []
  if (!meanings.length) {
    throw new Error('暂未找到词典释义')
  }

  return {
    word,
    phonetic: response.basic?.phonetic ?? '',
    meanings,
    example: '',
    exampleTranslation: '',
  }
}

export async function lookupYoudaoWord(word, { signal } = {}) {
  const appKey = getRequiredEnv('VITE_YOUDAO_APP_KEY')
  const appSecret = getRequiredEnv('VITE_YOUDAO_APP_SECRET')
  const salt = createSalt()
  const curtime = String(Math.floor(Date.now() / 1000))
  const sign = await sha256(`${appKey}${truncateForSignature(word)}${salt}${curtime}${appSecret}`)
  const params = new URLSearchParams({
    q: word,
    from: 'en',
    to: 'zh-CHS',
    appKey,
    salt,
    sign,
    signType: 'v3',
    curtime,
  })

  const response = await requestJsonp(`${YOUDAO_ENDPOINT}?${params}`, { signal })
  return normalizeYoudaoTranslation(response, word)
}
