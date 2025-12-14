/** @vitest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { marked } from 'marked'

import BlogsPage from './BlogsPage'

describe('Blog preview', () => {
  it('renders markdown preview as HTML', () => {
    render(<BlogsPage />)
    // open new blog modal
    fireEvent.click(screen.getByText('New Blog'))
    const ta = screen.getByPlaceholderText('Markdown content')
    fireEvent.change(ta, { target: { value: '# Heading' } })
    const preview = screen.getByText('Heading', { selector: 'h1' })
    expect(preview).toBeTruthy()
  })
})