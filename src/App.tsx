import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PublicForm from './pages/PublicForm';

// Route-level code splitting: পাবলিক ফরমের ইউজাররা অ্যাডমিন/সংগ্রাহকের কোড ডাউনলোড করে না
const CollectorPage = lazy(() => import('./pages/Collector'));
const AdminPage = lazy(() => import('./pages/Admin'));

function PageLoader() {
  return (
    <div className="grid place-items-center py-24 text-stone-400" role="status">
      <span className="text-3xl">🪔</span>
      <p className="mt-2 text-sm">লোড হচ্ছে...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<PublicForm />} />
            <Route path="/collect" element={<CollectorPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<PublicForm />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
