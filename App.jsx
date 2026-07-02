// src/App.jsx - Main App Component
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './index.css';

// Pages/Components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Memories from './pages/Memories';
import Letters from './pages/Letters';
import Planner from './pages/Planner';

const API_URL = 'http://localhost/niko_kim_memories/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(err => {
        console.log('Service worker registration failed:', err);
      });
    }
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="text-center">
          <div className="text-6xl mb-4">💖</div>
          <p className="text-pink-400 font-semibold">Loading your memories...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="bg-gradient-to-b from-pink-50 via-white to-purple-50 min-h-screen font-sans">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
          />
          <Route 
            path="/register" 
            element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/dashboard" />}
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route 
            path="/chat" 
            element={user ? <Chat user={user} /> : <Navigate to="/login" />}
          />
          <Route 
            path="/memories" 
            element={user ? <Memories user={user} /> : <Navigate to="/login" />}
          />
          <Route 
            path="/letters" 
            element={user ? <Letters user={user} /> : <Navigate to="/login" />}
          />
          <Route 
            path="/planner" 
            element={user ? <Planner user={user} /> : <Navigate to="/login" />}
          />
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
