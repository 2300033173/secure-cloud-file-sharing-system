import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Files from './pages/Files';
import ActivityLogs from './pages/ActivityLogs';
import Admin from './pages/Admin';
import MFASettings from './pages/MFASettings';
import './styles/Global.css';
import './styles/App.css';

const AppShell = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="app-main">
      <Topbar />
      <main className="page-content">{children}</main>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute><AppShell><Upload /></AppShell></ProtectedRoute>
      } />
      <Route path="/files" element={
        <ProtectedRoute><AppShell><Files /></AppShell></ProtectedRoute>
      } />
      <Route path="/logs" element={
        <ProtectedRoute><AppShell><ActivityLogs /></AppShell></ProtectedRoute>
      } />
      <Route path="/mfa-settings" element={
        <ProtectedRoute><AppShell><MFASettings /></AppShell></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['Admin']}><AppShell><Admin /></AppShell></ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="blur-orb orb1" />
          <div className="blur-orb orb2" />
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
