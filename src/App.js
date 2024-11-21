import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AuthProvider from './components/AuthProvider';
import Home from './pages/Home';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Navbar from './components/navbar';
import Profile from './pages/Profile';
import RolePage from './components/RolePage';
import EmployeeAuth from './components/EmployeeAuth';
import BusinessAuth from './components/BusinessAuth';
import ManageEmployees from './pages/ManageEmployees';
import { ContextProvider } from './components/UserContext';
import Connections from './pages/Connections';
import PlaceOrder from './pages/PlaceOrder';
import OrderDetails from './components/OrderDetails';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ContextProvider>
          <Routes>
            <Route path="/rolePage" element={<RolePage />} />
            <Route path="/employeeAuth" element={<EmployeeAuth />} />
            <Route path="/businessAuth" element={<BusinessAuth />} />
            <Route path="/products" element={<><Navbar /><ProtectedRoute children={<Products />} /></>} />
            <Route path="/manage-employees" element={<ProtectedRoute><><Navbar /><Home /><ManageEmployees /></></ProtectedRoute>} />
            <Route path="/" element={<><Navbar /><ProtectedRoute children={<Home />} /></>} />
            <Route path="/orders" element={<><Navbar /><ProtectedRoute children={<Orders />} /></>} />
            <Route path="/inventory" element={<><Navbar /><ProtectedRoute children={<Inventory />} /></>} />
            <Route path="/connections" element={<><Navbar /><ProtectedRoute children={<Connections />} /></>} />
            <Route path="/profile" element={<ProtectedRoute><><Navbar /><Profile /></></ProtectedRoute>} />
            <Route path="/place-order" element={<ProtectedRoute><><Navbar /><PlaceOrder /></></ProtectedRoute>} />
            <Route path="/order/:orderId" element={<ProtectedRoute><><Navbar /><OrderDetails /></></ProtectedRoute>} />
          </Routes>
        </ContextProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
