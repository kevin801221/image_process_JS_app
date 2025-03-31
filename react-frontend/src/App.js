import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Context providers
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';

// Layout components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ProductCopyPage from './pages/ProductCopyPage';
import ImageUnderstandingPage from './pages/ImageUnderstandingPage';
import ImageEditorPage from './pages/ImageEditorPage';
import BatchUploadPage from './pages/BatchUploadPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="product-copy" element={<ProductCopyPage />} />
              <Route path="image-understanding" element={<ImageUnderstandingPage />} />
              <Route path="image-editor" element={<ImageEditorPage />} />
              <Route path="batch-upload" element={<BatchUploadPage />} />
              <Route path="my-files" element={<BatchUploadPage />} />
              <Route path="generation-history" element={<BatchUploadPage />} />
              <Route path="disclaimer" element={<BatchUploadPage />} />
              <Route path="user" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
