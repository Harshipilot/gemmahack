const baseUrl = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api')

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || response.statusText)
  }
  return response.json()
}

export async function getDashboard() {
  return request('/dashboard')
}

export async function getProducts() {
  return request('/products')
}

export async function getAnalytics() {
  return request('/analytics')
}

export async function getTopSelling() {
  return request('/top-selling')
}

export async function getLowStock() {
  return request('/low-stock')
}

export async function getOverstock() {
  return request('/overstock')
}

export async function getExpiring() {
  return request('/expiring')
}

export async function queryChatbot(query) {
  return request(`/chat/context?q=${encodeURIComponent(query)}`)
}
