import { describe, it, expect } from 'vitest'
import { estimateReadTime } from '../readTime'

describe('estimateReadTime', () => {
  it('estimates time based on ~200 wpm', () => {
    const short = 'one two three'
    expect(estimateReadTime(short)).toBe(1)
    const long = Array(1000).fill('word').join(' ')
    expect(estimateReadTime(long)).toBeGreaterThanOrEqual(4)
  })
})
