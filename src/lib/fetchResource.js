function createHttpError(response, fallbackMessage) {
  return new Error(fallbackMessage ?? `Request failed (${response.status})`)
}

async function fetchResource(url, options) {
  const response = await fetch(url, options?.requestInit)

  if (!response.ok) {
    throw createHttpError(response, options?.errorMessage)
  }

  return response
}

export async function fetchJson(url, options = {}) {
  const response = await fetchResource(url, options)

  try {
    return await response.json()
  } catch {
    throw new Error(options.invalidJsonMessage ?? 'Response is not valid JSON')
  }
}

export async function fetchText(url, options = {}) {
  return (await fetchResource(url, options)).text()
}
