import React, { useEffect, useMemo, useState } from 'react'
import { Blog } from '../../types'
import { v4 as uuidv4 } from 'uuid'
import { slugify } from '../../utils/slug'
import { estimateReadTime } from '../../utils/readTime'
import { marked } from 'marked'

import { listBlogs, upsertBlog, deleteBlog, purgeDeleted, hardDeleteBlog } from '../../services/blogsService'

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showTrash, setShowTrash] = useState(false)
  const [editing, setEditing] = useState<Blog | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const existing = await listBlogs(showTrash)
      // trigger purge in background when not viewing trash (guard when module is mocked)
      if (!showTrash && typeof purgeDeleted === 'function') {
        const res = (purgeDeleted as any)()
        if (res && typeof res.catch === 'function') res.catch(() => {})
      }
      if (!mounted) return
      if (existing.length === 0) {
        const sample: Blog[] = [
          {
            id: 'sample-1',
            title: 'Welcome to your blog',
            slug: 'welcome-to-your-blog',
            content: 'This is a sample blog to get you started.',
            tags: ['welcome', 'intro'],
            published: true,
            image: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            readTime: 1,
          },
        ]
        setBlogs(sample)
        await Promise.all(sample.map((s) => upsertBlog(s)))
      } else {
        setBlogs(existing)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    // reload when toggling trash view
    let mounted = true
    ;(async () => {
      const existing = await listBlogs(showTrash)
      if (!mounted) return
      setBlogs(existing)
    })()
    return () => {
      mounted = false
    }
  }, [showTrash])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return blogs.filter((b) => {
      if (filter === 'published' && !b.published) return false
      if (filter === 'draft' && b.published) return false
      if (!q) return true
      return (
        b.title.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)) ||
        b.content.toLowerCase().includes(q)
      )
    })
  }, [blogs, query, filter])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))

  const pageItems = filtered.slice((page - 1) * perPage, page * perPage)

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  async function remove(id: string) {
    if (!confirm('Move this blog to Trash?')) return
    setBlogs((s) => s.filter((b) => b.id !== id))
    await deleteBlog(id)
  }

  async function restore(id: string) {
    const b = blogs.find((x) => x.id === id)
    if (!b) return
    const restored = { ...b, deleted: false, deletedAt: null, updatedAt: new Date().toISOString() }
    setBlogs((s) => s.map((x) => (x.id === id ? restored : x)))
    await upsertBlog(restored)
  }

  async function destroy(id: string) {
    if (!confirm('Permanently delete this blog? This cannot be undone.')) return
    setBlogs((s) => s.filter((b) => b.id !== id))
    await hardDeleteBlog(id)
  }

  async function togglePublish(id: string) {
    setBlogs((s) =>
      s.map((b) => (b.id === id ? { ...b, published: !b.published, updatedAt: new Date().toISOString() } : b))
    )
    const b = blogs.find((x) => x.id === id)
    if (b) {
      const updated = { ...b, published: !b.published, updatedAt: new Date().toISOString() }
      await upsertBlog(updated)
    }
  }

  function edit(b: Blog) {
    setEditing(b)
    setShowForm(true)
  }

  async function saveBlog(payload: Partial<Blog> & { id?: string }) {
    if (payload.id) {
      setBlogs((s) => s.map((b) => (b.id === payload.id ? { ...(b as Blog), ...payload, updatedAt: new Date().toISOString() } : b)))
      const existing = blogs.find((b) => b.id === payload.id) as Blog
      const updated = { ...(existing || {}), ...(payload as any), updatedAt: new Date().toISOString() } as Blog
      await upsertBlog(updated)
    } else {
      const content = payload.content || ''
      const newBlog: Blog = {
        id: uuidv4(),
        title: payload.title || 'Untitled',
        slug: slugify(payload.title || 'untitled'),
        content,
        tags: payload.tags || [],
        published: payload.published || false,
        image: payload.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTime: estimateReadTime(content),
      }
      setBlogs((s) => [newBlog, ...s])
      await upsertBlog(newBlog)
    }
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">Blogs</h2>
        <div className="flex gap-2">
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <label className="flex items-center gap-2">
            <input aria-label="Show Trash" type="checkbox" checked={showTrash} onChange={(e) => setShowTrash(e.target.checked)} /> Show Trash
          </label>
          <input
            placeholder="Search title, tags, content"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button onClick={openNew} className="bg-blue-600 text-white px-3 py-1 rounded">
            New Blog
          </button>
        </div>
      </div>

      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Tags</th>
              <th className="p-2">Read</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-2">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-xs text-gray-500">{b.slug}</div>
                </td>
                <td className="p-2">{b.tags.join(', ')}</td>
                <td className="p-2">{b.readTime} min</td>
                <td className="p-2">{b.published ? 'Published' : 'Draft'}</td>
                <td className="p-2 flex gap-2">
                  {!b.deleted && (
                    <>
                      <button onClick={() => edit(b)} className="px-2 py-1 border rounded">Edit</button>
                      <button onClick={() => togglePublish(b.id)} className="px-2 py-1 border rounded">Toggle</button>
                      <button onClick={() => remove(b.id)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                    </>
                  )}
                  {b.deleted && (
                    <>
                      <button onClick={() => restore(b.id)} className="px-2 py-1 border rounded">Restore</button>
                      <button onClick={() => destroy(b.id)} className="px-2 py-1 border rounded text-red-600">Delete Permanently</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No blogs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          Page {page} / {pages} • {total} items
        </div>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">
            Prev
          </button>
          <button disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
      </div>

      {showForm && (
        <BlogForm blog={editing || undefined} onCancel={() => setShowForm(false)} onSave={saveBlog} />
      )}
    </div>
  )
}

function BlogForm({ blog, onCancel, onSave }: { blog?: Blog; onCancel: () => void; onSave: (b: any) => void }) {
  const [title, setTitle] = useState(blog?.title ?? '')
  const [content, setContent] = useState(blog?.content ?? '')
  const [tagsRaw, setTagsRaw] = useState(blog?.tags.join(', ') ?? '')
  const [published, setPublished] = useState(blog?.published ?? false)
  const [image, setImage] = useState<string | undefined>(blog?.image)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const originalRef = React.useRef({ title: blog?.title ?? '', content: blog?.content ?? '', tagsRaw: blog?.tags.join(', ') ?? '', published: blog?.published ?? false, image: blog?.image })

  useEffect(() => {
    originalRef.current = { title: blog?.title ?? '', content: blog?.content ?? '', tagsRaw: blog?.tags.join(', ') ?? '', published: blog?.published ?? false, image: blog?.image }
    setIsDirty(false)
  }, [blog?.id])

  useEffect(() => {
    // autosave draft
    const draftKey = `draft_${blog?.id ?? 'new'}`
    const t = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ title, content, tagsRaw }))
    }, 500)
    return () => clearTimeout(t)
  }, [title, content, tagsRaw, blog?.id])

  useEffect(() => {
    const orig = originalRef.current
    const dirty = title !== orig.title || content !== orig.content || tagsRaw !== orig.tagsRaw || published !== orig.published || image !== orig.image
    setIsDirty(dirty)
  }, [title, content, tagsRaw, published, image])

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function handleImage(file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setError('Only PNG or JPEG allowed')
    if (file.size > 2 * 1024 * 1024) return setError('Max size 2MB')
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!title.trim()) return setError('Title is required')
    onSave({ id: blog?.id, title: title.trim(), content, tags: tagsRaw.split(',').map((t) => t.trim()).filter(Boolean), published, image })
    // reset dirty + remove draft
    setIsDirty(false)
    const draftKey = `draft_${blog?.id ?? 'new'}`
    localStorage.removeItem(draftKey)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center" role="presentation">
      <div className="bg-white rounded shadow w-full max-w-2xl p-4" role="dialog" aria-modal="true" aria-labelledby="blog-form-title">
        <div className="flex items-center justify-between">
          <h3 id="blog-form-title" className="text-lg font-semibold">{blog ? 'Edit Blog' : 'New Blog'}</h3>
            <div className="flex gap-2">
            <button type="button" onClick={() => {
                if (isDirty && !confirm('You have unsaved changes. Discard?')) return
                onCancel()
              }} className="px-3 py-1 border rounded">Cancel</button>
            <button type="button" disabled={!isDirty} onClick={submit} className={`bg-blue-600 text-white px-3 py-1 rounded ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}>Save</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label htmlFor="title-input" className="sr-only">Title</label>
          <input id="title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="border rounded px-2 py-2" />

          <label htmlFor="content-input" className="sr-only">Content</label>
          <textarea id="content-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Markdown content" rows={8} className="border rounded px-2 py-2"></textarea>

          <div>
            <div className="text-sm font-medium">Preview</div>
            <div className="prose mt-2 border rounded p-2 max-h-40 overflow-auto" dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }} />
          </div>

          <label htmlFor="tags-input" className="sr-only">Tags</label>
          <input id="tags-input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="tags: a, b, c" className="border rounded px-2 py-1" />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input aria-label="Published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published
            </label>
            <label className="flex items-center gap-2">
              <input aria-label="Upload image" type="file" accept="image/*" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
            {image && <img src={image} className="h-16 w-24 object-cover rounded" alt="preview" />}
          </div>

          {error && <div className="text-red-600" role="alert">{error}</div>}

          <div className="text-sm text-gray-600">Read time: {estimateReadTime(content)} min • Slug: {slugify(title || '')}</div>
        </div>
      </div>
    </div>
  )
}
