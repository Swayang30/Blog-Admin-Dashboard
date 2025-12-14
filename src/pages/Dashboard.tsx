import React from 'react'
import Layout from '../components/Layout'
import BlogsPage from './blogs/BlogsPage'

export default function Dashboard() {
  return (
    <Layout>
      <div id="blogs">
        <BlogsPage />
      </div>
    </Layout>
  )
}
