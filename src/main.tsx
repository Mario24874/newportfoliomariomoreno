// src/index.tsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';

// Portal admin privado en /admin — se carga aparte y no arrastra el SPA del portfolio.
const AdminApp = React.lazy(() => import('./admin/AdminApp'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <ThemeProvider>
        <ThemeWrapper>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeWrapper>
      </ThemeProvider>
    )}
  </React.StrictMode>
);