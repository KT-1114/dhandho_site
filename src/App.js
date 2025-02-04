import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LayersIcon from '@mui/icons-material/Layers';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthProvider from './components/Auth/AuthProvider';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './pages/Home';
import Settings from './pages/Settings';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Connections from './pages/Connections';
import RolePage from './components/Auth/RolePage';
import EmployeeAuth from './pages/EmployeeAuth';
import BusinessAuth from './pages/BusinessAuth';
import logo from './assets/logo.png';  // Adjust the path based on your project structure
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectWithoutContact, ViewList } from '@mui/icons-material';

// Define the navigation structure
const NAVIGATION = [
  { kind: 'header', title: 'Main items' },
  {
    segment: './',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    segment: 'orders',
    title: 'Orders',
    icon: <ViewList />,
  },
  {
    segment: 'products',
    title: 'Products',
    icon: <LayersIcon />,
  },
  {
    segment: 'connections',
    title: 'Connections',
    icon: <ConnectWithoutContact />,
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
  },
];

// Define the custom theme
const demoTheme = extendTheme({
  colorSchemes: { light: true, dark: true },
  colorSchemeSelector: 'class',
});

// Define the branding object
const branding = {
  logo: <img src={logo} alt="Logo" />,
  title: '',  // Update title if needed
  homeUrl: '/',  // Ensure home URL is set correctly
};

// Initialize the Query Client for React Query
const queryClient = new QueryClient();

// Main component rendering the layout and routes
export default function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Wrap the app with the QueryClientProvider for data fetching */}
        <QueryClientProvider client={queryClient}>
          <AppProvider
            navigation={NAVIGATION}
            theme={demoTheme}
            branding={branding}
          >
            <DashboardLayout defaultSidebarCollapsed>
              <PageContainer>
                <Routes>
                  <Route path="/rolePage" element={<RolePage />} />
                  <Route path="/employeeAuth" element={<EmployeeAuth />} />
                  <Route path="/businessAuth" element={<BusinessAuth />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
              </PageContainer>
            </DashboardLayout>
          </AppProvider>
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  );
}
