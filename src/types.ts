export type Blog = {
  id: string
  title: string
  slug: string
  content: string
  tags: string[]
  published: boolean
  image?: string // data URL
  createdAt: string
  updatedAt: string
  readTime: number
  // Soft-delete fields
  deleted?: boolean
  deletedAt?: string | null
  // Schema version for migrations
  schemaVersion?: number
}
