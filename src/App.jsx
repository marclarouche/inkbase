import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ArticleList from './pages/ArticleList.jsx'
import ArticleReader from './pages/ArticleReader.jsx'
import ArticleEditor from './pages/ArticleEditor.jsx'
import DiffView from './pages/DiffView.jsx'
import ReviewQueue from './pages/ReviewQueue.jsx'
import NewArticle from './pages/NewArticle'
import CatalogList from './pages/CatalogList.jsx'
import { RepoProvider } from './components/RepoContext.jsx'

export default function App() {
  return (
    <RepoProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ArticleList />} />
          <Route path="article/:slug" element={<ArticleReader />} />
          <Route path="article/:slug/edit" element={<ArticleEditor />} />
          <Route path="article/:slug/diff" element={<DiffView />} />
          <Route path="review" element={<ReviewQueue />} />
          <Route path="new" element={<NewArticle />} />
          {/* ── Catalog routes — NIST control families ── */}
          <Route path="catalog" element={<CatalogList />} />
          <Route path="catalog/:slug/edit" element={<ArticleEditor rootPath="catalogs/nist-800-53-r5" />} />
        </Route>
      </Routes>
    </RepoProvider>
  )
}
