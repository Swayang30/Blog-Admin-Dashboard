import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <a href="#main" className="sr-only focus:not-sr-only p-2 bg-yellow-300">Skip to main</a>
      <aside className="w-64 bg-white border-r hidden md:block" aria-label="Sidebar">
        <div className="p-4 font-bold text-xl">Blog Admin</div>
        <nav className="p-4" aria-label="Main navigation">
          <a href="#" className="block py-2 px-3 rounded hover:bg-gray-100">
            Dashboard
          </a>
          <a href="#blogs" className="block py-2 px-3 rounded hover:bg-gray-100">
            Blogs
          </a>
        </nav>
      </aside>
      <div className="flex-1">
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="font-semibold">Dashboard</div>
          <div className="flex items-center gap-4">
            <label htmlFor="global-search" className="sr-only">Search blogs</label>
            <input
              id="global-search"
              placeholder="Search blog..."
              className="border rounded px-2 py-1"
            />
            <button aria-label="Create new blog" className="bg-blue-600 text-white px-3 py-1 rounded">+ New</button>
          </div>
        </header>
        <main id="main" className="p-4">{children}</main>
      </div>
    </div>
  )
}
