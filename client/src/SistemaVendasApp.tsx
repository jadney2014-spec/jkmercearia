import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './firebase/AuthContext';
import { useCacheInvalidation } from './hooks/useRouteRefresh';
import LoginFirebase from './pages/LoginFirebase';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import PageSkeleton from './components/PageSkeleton';
import SmartLoading from './components/SmartLoading';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorFallback from './components/PageErrorFallback';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { useUserRole } from './hooks/useUserRole';
import { appPath } from './constants/app';

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Vendas = lazyWithRetry(() => import('./pages/Vendas'));
const Products = lazyWithRetry(() => import('./pages/Products'));
const Compras = lazyWithRetry(() => import('./pages/Compras'));
const ListaManual = lazyWithRetry(() => import('./pages/ListaManual'));
const Categories = lazyWithRetry(() => import('./pages/Categories'));
const Welcome = lazyWithRetry(() => import('./pages/Welcome'));
const Fiados = lazyWithRetry(() => import('./pages/Fiados'));
const Reports = lazyWithRetry(() => import('./pages/Reports'));
const AdminsAdmin = lazyWithRetry(() => import('./pages/AdminsAdmin'));

function SistemaVendasApp() {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading, isAdmin, isTesouraria, isVendedor } = useUserRole();

  useCacheInvalidation();

  useEffect(() => {
    try {
      const cacheKeys = ['dashboard_cache', 'products_cache', 'sales_cache', 'categories_cache'];
      const now = Date.now();
      const MAX_CACHE_AGE = 120000;

      cacheKeys.forEach((key) => {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.lastFetch && now - parsed.lastFetch > MAX_CACHE_AGE) {
              sessionStorage.removeItem(key);
            }
          } catch {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch {
      // ignore
    }
  }, [user]);

  if (loading || roleLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="login" element={<LoginFirebase />} />
        <Route path="*" element={<Navigate to={appPath('login')} replace />} />
      </Routes>
    );
  }

  const canSell = isAdmin || isTesouraria || isVendedor;

  const RoleProtectedRoute: React.FC<{ allow: string[]; children: React.ReactNode }> = ({
    allow,
    children,
  }) => {
    if (isAdmin) return <>{children}</>;
    if (allow.includes(role)) return <>{children}</>;
    return <Navigate to={appPath('welcome')} replace />;
  };

  return (
    <Layout>
      <ErrorBoundary fallback={<PageErrorFallback />}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <PageSkeleton type="dashboard" />
            </div>
          }
        >
          <SmartLoading>
            <Routes>
              <Route path="/" element={<Navigate to={appPath('welcome')} replace />} />
              <Route path="welcome" element={<Welcome />} />

              <Route
                path="dashboard"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="vendas"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Vendas />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="fiados"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Fiados />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="compras"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Compras />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="lista-manual"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <ListaManual />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="products"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Products />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="reports"
                element={
                  <RoleProtectedRoute allow={['admin', 'vendedor', 'tesouraria']}>
                    <Reports />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="categories"
                element={
                  <RoleProtectedRoute allow={['admin']}>
                    <Categories />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="admin/admins"
                element={
                  <RoleProtectedRoute allow={['admin']}>
                    <AdminsAdmin />
                  </RoleProtectedRoute>
                }
              />

              {/* Redirecionar rotas antigas */}
              <Route path="transactions" element={<Navigate to={appPath('vendas')} replace />} />
              <Route path="members" element={<Navigate to={appPath('welcome')} replace />} />
              <Route path="*" element={<Navigate to={canSell ? appPath('vendas') : appPath('welcome')} replace />} />
            </Routes>
          </SmartLoading>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default SistemaVendasApp;
