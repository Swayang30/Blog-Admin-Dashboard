import { describe, it, expect } from 'vitest'
import { slugify } from '../slug'

describe('slugify', () => {
  it('creates url friendly slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
    expect(slugify(' Trim  multiple   spaces ')).toBe('trim-multiple-spaces')
    expect(slugify('Symbols #$%')).toBe('symbols')
  })
})
