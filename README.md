# Blog Admin Dashboard

A small React + Vite + TypeScript admin dashboard for managing blogs.

Features:
- Responsive layout (Sidebar + Navbar + Content)
- CRUD operations for blogs (Create/Edit/Delete)
- Pagination (5 or 10 per page), Search & Filters (published/draft)
- Image validation (PNG/JPEG, max 2MB) + preview
- Local persistence using `localStorage`
- Brain Task: Markdown editor with live preview and autosave draft
- Quick Logic Task: Slug generation and read time estimation

Getting started:

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Run unit tests

```bash
npm run test
```

4. Run E2E tests

```bash
npm run test:e2e
```

Notes:
- Tailwind is configured; ensure you run the build with PostCSS if needed.
- Data uses Firebase Firestore when Firebase is configured (see `.env.example`). Falls back to LocalStorage under `blogs_v1` if Firebase isn't configured.
- To enable Firebase, copy `.env.example` to `.env` and fill your Firebase config values.

Additional notes and implementation details:

- Soft delete (Trash): deleting a blog now performs a soft-delete (the blog is marked with `deleted: true` and `deletedAt` instead of being removed immediately). Use the "Show Trash" checkbox in the UI to view deleted items, restore them, or permanently delete them.
- Auto-purge: soft-deleted items are automatically purged after a retention period (default 30 days). The service exposes `purgeDeleted(retentionDays?: number)` and `hardDeleteBlog(id)` in `src/services/blogsService.ts`.
- Schema migration: the `Blog` type now contains `deleted`, `deletedAt`, and `schemaVersion` fields to support migrations and soft-delete behavior. Older local data is migrated on read.
- Form UX improvements: the blog form tracks changes (dirty state) — the `Save` button is disabled until there are unsaved changes, cancel warns when there are unsaved changes, and a `beforeunload` prompt warns on page close when the form is dirty.
- Tests: unit tests for the new flows are included under `src/services/__tests__/blogsService.test.ts` and `src/pages/blogs/BlogsPage.test.tsx`. Playwright E2E tests remain in `tests/e2e` and can be run with `npm run test:e2e`.

If you'd like, I can add a Playwright E2E test to cover restore and permanent-delete flows, or polish the Trash UI.
