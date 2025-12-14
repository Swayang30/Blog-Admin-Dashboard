/** @vitest-environment jsdom */
import { beforeAll, beforeEach, describe, it, expect, vi } from 'vitest'


beforeAll(() => {
  process.env.VITE_FIREBASE_PROJECT_ID = ''
})


vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: () => [],
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}))

import {
  listBlogs,
  upsertBlog,
  deleteBlog,
  purgeDeleted,
  hardDeleteBlog,
} from '../blogsService'
import { Blog } from '../../types'

describe('blogsService (local fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('upsert and list works and soft-delete hides from list', async () => {
    const b: Blog = {
      id: 't1',
      title: 'T',
      slug: 't',
      content: 'c',
      tags: [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTime: 1,
    }

    await upsertBlog(b)
    const all = await listBlogs()
    expect(all.find((x) => x.id === 't1')).toBeTruthy()

    await deleteBlog('t1')
    const after = await listBlogs()
    expect(after.find((x) => x.id === 't1')).toBeUndefined()
  })

  it('purgeDeleted removes items older than retention', async () => {
    const now = new Date().toISOString()

    const old = {
      id: 'old',
      title: 'Old',
      slug: 'old',
      content: 'x',
      tags: [],
      published: false,
      createdAt: now,
      updatedAt: now,
      readTime: 1,
      deleted: true,
      deletedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    } as Blog

    const recent = {
      id: 'recent',
      title: 'Recent',
      slug: 'r',
      content: 'x',
      tags: [],
      published: false,
      createdAt: now,
      updatedAt: now,
      readTime: 1,
      deleted: true,
      deletedAt: new Date().toISOString(),
    } as Blog

    await upsertBlog(old)
    await upsertBlog(recent)

    await purgeDeleted(30)

    const list = await listBlogs(true)
    expect(list.find((x) => x.id === 'old')).toBeUndefined()
    expect(list.find((x) => x.id === 'recent')).toBeTruthy()
  })

  it('hardDeleteBlog removes permanently', async () => {
    const b: Blog = {
      id: 'perm',
      title: 'P',
      slug: 'p',
      content: 'c',
      tags: [],
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTime: 1,
    }

    await upsertBlog(b)
    await hardDeleteBlog('perm')

    const all = await listBlogs(true)
    expect(all.find((x) => x.id === 'perm')).toBeUndefined()
  })
})
