export function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const wpm = 200
  return Math.max(1, Math.round(words / wpm))
}
