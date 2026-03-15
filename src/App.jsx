import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ArticleList from './pages/ArticleList.jsx'
import ArticleReader from './pages/ArticleReader.jsx'
import ArticleEditor from './pages/ArticleEditor.jsx'
import DiffView from './pages/DiffView.jsx'
import ReviewQueue from './pages/ReviewQueue.jsx'
import NewArticle from './pages/NewArticle'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ArticleList />} />
        <Route path="article/:slug" element={<ArticleReader />} />
        <Route path="article/:slug/edit" element={<ArticleEditor />} />
        <Route path="article/:slug/diff" element={<DiffView />} />
        <Route path="review" element={<ReviewQueue />} />
        <Route path="new" element={<NewArticle />} />
      </Route>
    </Routes>
  )
}
