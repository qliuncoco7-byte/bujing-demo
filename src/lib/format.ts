export function formatTime(seconds: number, decimals = 1): string {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const secs = Math.floor(safe % 60)
  const fraction = Math.floor((safe % 1) * 10 ** decimals)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(
    fraction,
  ).padStart(decimals, '0')}`
}

export function formatRuler(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
