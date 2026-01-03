/**
 * Main App Component
 * Handles routing and authentication state
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import Questions from './pages/Questions';
import Coverage from './pages/Coverage';
import BloomLevelCoverage from './pages/BloomLevelCoverage';
import QuestionGenerator from './pages/QuestionGenerator';
import { getAuthToken, setAuthToken, removeAuthToken } from './utils/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          removeAuthToken();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        removeAuthToken();
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  const handleLogin = (token, userData) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Register onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Dashboard user={user} /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/modules" 
            element={
              isAuthenticated ? 
                <Modules /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/questions" 
            element={
              isAuthenticated ? 
                <Questions /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/coverage" 
            element={
              isAuthenticated ? 
                <Coverage /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/bloom-coverage" 
            element={
              isAuthenticated ? 
                <BloomLevelCoverage /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/generator" 
            element={
              isAuthenticated ? 
                <QuestionGenerator /> : 
                <Navigate to="/login" />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

