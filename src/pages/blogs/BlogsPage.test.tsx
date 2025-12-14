/** @vitest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BlogsPage from './BlogsPage'
import * as svc from '../../services/blogsService'
import { describe, it, vi, expect, beforeEach } from 'vitest'

vi.mock('../../services/blogsService')

describe('BlogsPage', () => {
  beforeEach(() => {
    ;(svc.listBlogs as any).mockResolvedValue([
      {
        id: 'sample-1',
        title: 'Sample',
        slug: 'sample',
        content: 'hello',
        tags: ['a'],
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTime: 1,
      },
    ])
    ;(svc.upsertBlog as any).mockResolvedValue(undefined)
    ;(svc.deleteBlog as any).mockResolvedValue(undefined)
  })

  it('renders list and can create a blog', async () => {
    render(<BlogsPage />)
    await screen.findAllByText('Sample')

    fireEvent.click(screen.getAllByText('New Blog')[0])
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Test Create' } })
    fireEvent.change(screen.getByPlaceholderText('Markdown content'), { target: { value: 'body' } })
    fireEvent.click(screen.getByText('Save'))

    await screen.findByText('Test Create')
    expect(screen.getByText('Test Create')).toBeTruthy()
  })

  it('disables save until form changed and warns on cancel when dirty', async () => {
    render(<BlogsPage />)
    await screen.findAllByText('Sample')

    fireEvent.click(screen.getAllByText('New Blog')[0])
    // Save should be disabled initially
    const save = screen.getByText('Save') as HTMLButtonElement
    expect(save.disabled).toBeTruthy()

    // change title
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Unsaved Title' } })
    expect(save.disabled).toBeFalsy()

    // cancel should confirm when dirty
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false)
    fireEvent.click(screen.getByText('Cancel'))
    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('edit form Save disabled until changed', async () => {
    render(<BlogsPage />)
    await screen.findAllByText('Sample')

    // open edit for existing sample
    fireEvent.click(screen.getAllByText('Edit')[0])
    const save = screen.getByText('Save') as HTMLButtonElement
    expect(save.disabled).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Sample Updated' } })
    expect(save.disabled).toBeFalsy()
  })
})