import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import './styles/sanrio-theme.css';

// Pages/Components
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Memories from './pages/Memories';
import Letters from './pages/Letters';
import DailyQuestion from './pages/DailyQuestion';
import Planner from './pages/Planner';
import Invite from './pages/Invite';
import AcceptInvite from './pages/AcceptInvite';

function App() {
  const defaultUsers = {
    niko: { id: 1, name: 'Niko', email: 'niko@example.com' },
    kim: { id: 2, name: 'Kim', email: 'kim@example.com' },
  };

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return defaultUsers.niko;

      const parsed = JSON.parse(stored);
      return parsed?.id && parsed?.name ? parsed : defaultUsers.niko;
    } catch (error) {
      localStorage.removeItem('user');
      return defaultUsers.niko;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
      document.documentElement.style.scrollBehavior = 'auto';
    }

    setLoading(false);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister any existing service workers to avoid serving stale cached builds
      // (Netlify + SPA builds sometimes leave old service workers active).
      try {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => {
            reg.unregister().catch(() => {});
          });
        }).catch(() => {});
      } catch (err) {
        // ignore
      }
      // Do not register a new service worker by default. If you want to enable
      // an offline service worker in the future, add an explicit opt-in flag
      // or a separate registration flow.
    }
  }, []);

  const switchUser = (which) => {
    const u = which === 'kim' ? defaultUsers.kim : defaultUsers.niko;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
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
      <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-white min-h-screen font-sans">
        <Routes>
          <Route
            path="/dashboard"
            element={<Dashboard user={user} onSwitchUser={switchUser} />}
          />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/memories" element={<Memories user={user} />} />
          <Route path="/letters" element={<Letters user={user} />} />
          <Route path="/daily-question" element={<DailyQuestion user={user} />} />
          <Route path="/planner" element={<Planner user={user} />} />
          <Route path="/invite" element={<Invite user={user} />} />
          <Route path="/accept-invite" element={<AcceptInvite user={user} />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

