import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Connections from './pages/Connections';
import Settings from './pages/Settings';
import AuthProvider from './components/Auth/AuthProvider';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RolePage from './components/Auth/RolePage'
import BusinessAuth from './pages/BusinessAuth';
import EmployeeAuth from './pages/EmployeeAuth';
import PageNotFound from './pages/NotFound';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/orders', element: <ProtectedRoute><Orders /></ProtectedRoute> },
          { path: '/products', element: <ProtectedRoute><Products /></ProtectedRoute> },
          { path: '/connections', element: <ProtectedRoute><Connections /></ProtectedRoute> },
          { path: '/settings', element: <ProtectedRoute><Settings /></ProtectedRoute> },
        ],
      },
    ],
  },
  { path: '/rolePage', element: <RolePage /> },
  { path: '/businessAuth', element: <BusinessAuth /> }, // Business Auth Route
  { path: '/employeeAuth', element: <EmployeeAuth /> }, // Employee Auth Route
  { path: '*', element: <PageNotFound /> } // Catch-all for 404 Not Found
]);

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Move AuthProvider to wrap RouterProvider */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
