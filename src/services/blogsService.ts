import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, Firestore } from 'firebase/firestore'
import { initFirebase } from './firebase'
import { Blog } from '../types'

const KEY = 'blogs_v1'

function localList(): Blog[] {
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as Blog[]) : []
}

function localSave(list: Blog[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export async function listBlogs(includeDeleted = false): Promise<Blog[]> {
  const db = initFirebase()
  if (!db) {
    // migrate missing fields
    const migrated = localList().map((b) => ({ schemaVersion: 1, deleted: b.deleted ?? false, deletedAt: b.deletedAt ?? null, ...b }))
    if (!includeDeleted) return migrated.filter((b) => !b.deleted)
    return migrated
  }
  try {
    const col = collection(db as Firestore, 'blogs')
    const snap = await getDocs(col)
    const items = snap.docs.map((d) => ({ schemaVersion: 1, ...(d.data() as Blog) }))
    if (!includeDeleted) return items.filter((b) => !b.deleted)
    // Schedule background purge (non-blocking)
    purgeDeleted().catch((e) => console.warn('purge failed', e))
    return items
  } catch (e) {
    console.warn('listBlogs failed', e)
    const migrated = localList().map((b) => ({ schemaVersion: 1, deleted: b.deleted ?? false, deletedAt: b.deletedAt ?? null, ...b }))
    if (!includeDeleted) return migrated.filter((b) => !b.deleted)
    return migrated
  }
}

export async function purgeDeleted(retentionDays = 30): Promise<void> {
  const db = initFirebase()
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  if (!db) {
    const list = localList()
    const remaining = list.filter((b) => !(b.deleted && b.deletedAt && new Date(b.deletedAt).getTime() < cutoff))
    if (remaining.length !== list.length) localSave(remaining as Blog[])
    return
  }
  try {
    const col = collection(db as Firestore, 'blogs')
    const snap = await getDocs(col)
    await Promise.all(
      snap.docs.map(async (d) => {
        const b = d.data() as Blog
        if (b.deleted && b.deletedAt && new Date(b.deletedAt).getTime() < cutoff) {
          await deleteDoc(doc(db as Firestore, 'blogs', b.id))
        }
      })
    )
  } catch (e) {
    console.warn('purgeDeleted failed', e)
  }
}

export async function getBlog(id: string): Promise<Blog | null> {
  const db = initFirebase()
  if (!db) return localList().find((b) => b.id === id) || null
  try {
    const d = await getDoc(doc(db as Firestore, 'blogs', id))
    return d.exists() ? (d.data() as Blog) : null
  } catch (e) {
    console.warn('getBlog failed', e)
    return localList().find((b) => b.id === id) || null
  }
}

export async function upsertBlog(blog: Blog): Promise<void> {
  const db = initFirebase()
  if (!db) {
    const list = localList()
    const idx = list.findIndex((b) => b.id === blog.id)
    if (idx === -1) localSave([blog, ...list])
    else {
      list[idx] = blog
      localSave(list)
    }
    return
  }
  try {
    await setDoc(doc(db as Firestore, 'blogs', blog.id), blog)
  } catch (e) {
    console.warn('upsertBlog failed', e)
  }
}

export async function deleteBlog(id: string): Promise<void> {
  // Soft-delete: mark deleted and set deletedAt
  const db = initFirebase()
  if (!db) {
    const list = localList()
    const idx = list.findIndex((b) => b.id === id)
    if (idx === -1) return
    const b = list[idx]
    const updated = { ...b, deleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    list[idx] = updated
    localSave(list)
    return
  }
  try {
    const existing = await getDoc(doc(db as Firestore, 'blogs', id))
    if (!existing.exists()) return
    const data = existing.data() as Blog
    const updated = { ...data, deleted: true, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await setDoc(doc(db as Firestore, 'blogs', id), updated)
  } catch (e) {
    console.warn('deleteBlog failed', e)
  }
}

export async function hardDeleteBlog(id: string): Promise<void> {
  const db = initFirebase()
  if (!db) {
    localSave(localList().filter((b) => b.id !== id))
    return
  }
  try {
    await deleteDoc(doc(db as Firestore, 'blogs', id))
  } catch (e) {
    console.warn('hardDeleteBlog failed', e)
  }
}
