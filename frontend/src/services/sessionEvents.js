export function notifySessionExpired(response) {
  if (response?.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('radix:session-expired'))
  }
}
