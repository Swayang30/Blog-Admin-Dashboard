import { Blog } from '../types'

const KEY = 'blogs_v1'

export function loadBlogs(): Blog[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as Blog[]
  } catch (e) {
    console.error('loadBlogs error', e)
    return []
  }
}

export function saveBlogs(blogs: Blog[]) {
  localStorage.setItem(KEY, JSON.stringify(blogs))
}
