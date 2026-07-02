// src/pages/Dashboard.jsx - Dashboard Page
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLogOut, FiMessageSquare, FiImage, FiHeart, FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost/niko_kim_memories/api/dashboard.php';

function Dashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeling, setFeeling] = useState('happy');
  const navigate = useNavigate();

  const feelings = ['happy', 'loved', 'grateful', 'excited', 'peaceful'];

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?action=get_dashboard&user_id=${user.id}`
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">💖</div>
          <p className="text-pink-400">Loading your memories...</p>
        </div>
      </div>
    );
  }

  const { relationship, streak, daily_question, recent_memory } = dashboardData || {};

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">💖 Niko & Kim Memories</h1>
            <p className="text-pink-100">Together for: {relationship?.years}y {relationship?.months}m {relationship?.remaining_days}d</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-pink-500 p-3 rounded-full hover:bg-pink-50 transition"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-400 to-pink-400 text-white rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 mb-1">🔥 Love Streak</p>
              <h2 className="text-5xl font-bold">{streak?.current || 0} Days</h2>
              <p className="text-red-100 mt-2">Longest Streak: {streak?.longest || 0} Days</p>
            </div>
            <div className="text-7xl opacity-20">🔥</div>
          </div>
        </motion.div>

        {/* Feeling & Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Feeling Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-4 shadow-md border-2 border-pink-100"
          >
            <p className="text-gray-600 text-sm mb-2">😊 I'm feeling:</p>
            <select
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="w-full bg-pink-50 border-2 border-pink-200 rounded-lg p-2 font-semibold text-pink-600"
            >
              {feelings.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </motion.div>

          {/* Messages Count */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-4 shadow-md border-2 border-purple-100 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-600 text-sm">💌 Messages</p>
              <p className="text-2xl font-bold text-purple-600">{dashboardData?.unread_messages || 0}</p>
            </div>
            <FiMessageSquare className="text-purple-400" size={32} />
          </motion.div>
        </div>

        {/* Daily Question */}
        {daily_question && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-blue-100 mb-6"
          >
            <p className="text-blue-600 font-bold mb-2">💭 Today's Question</p>
            <p className="text-gray-800 font-semibold mb-4">{daily_question.question_text}</p>
            {dashboardData?.user_answer ? (
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-gray-600 mb-1">Your answer:</p>
                <p className="text-gray-800">{dashboardData.user_answer.answer_text}</p>
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition inline-block"
              >
                Answer Now
              </Link>
            )}
          </motion.div>
        )}

        {/* Recent Memory */}
        {recent_memory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border-2 border-yellow-100 mb-6"
          >
            <p className="text-yellow-600 font-bold mb-3">📸 Recent Memory</p>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">{recent_memory.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{recent_memory.description}</p>
              <p className="text-xs text-gray-500">
                📅 {new Date(recent_memory.memory_date).toLocaleDateString()}
                {recent_memory.location && ` • 📍 ${recent_memory.location}`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <FiMessageSquare size={32} className="mb-3" />
            <h3 className="text-xl font-bold mb-1">💬 Love Chat</h3>
            <p className="text-purple-100">Send messages & love notes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/memories')}
            className="bg-gradient-to-br from-orange-400 to-red-400 text-white rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <FiImage size={32} className="mb-3" />
            <h3 className="text-xl font-bold mb-1">📸 Memory Gallery</h3>
            <p className="text-orange-100">Relive your favorite moments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/letters')}
            className="bg-gradient-to-br from-pink-400 to-rose-400 text-white rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <FiHeart size={32} className="mb-3" />
            <h3 className="text-xl font-bold mb-1">💌 Love Letters</h3>
            <p className="text-pink-100">Write special themed letters</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/planner')}
            className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white rounded-2xl p-6 shadow-lg cursor-pointer"
          >
            <FiCalendar size={32} className="mb-3" />
            <h3 className="text-xl font-bold mb-1">📅 Shared Planner</h3>
            <p className="text-teal-100">Plan your future together</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
