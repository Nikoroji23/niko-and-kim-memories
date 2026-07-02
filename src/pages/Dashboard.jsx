import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMemories, getLetters, getPlanner, getMessages } from '../utils/localDB';
import { FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const API_URL = `${API_BASE_URL}/api/dashboard.php`;

function Dashboard({ user, onSwitchUser }) {
  const [dashboardData, setDashboardData] = useState({
    relationship: { years: 0, months: 0, remaining_days: 0 },
    streak: { current: 0, longest: 0 },
    unread_messages: 0,
    daily_question: { question_text: 'What made you smile today? 😊' },
    user_answer: null,
    recent_memory: {
      title: 'No memories yet',
      description: 'Start recording your first moment together.',
      memory_date: new Date().toISOString().split('T')[0],
      location: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [feeling, setFeeling] = useState('happy 😊');
  const navigate = useNavigate();

  const feelings = ['happy 😊', 'loved 💖', 'grateful 🙏', 'excited 🎉', 'peaceful 🌸'];

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const mems = await getMemories(user.id);
      const letters = await getLetters(user.id);
      const msgs = await getMessages(user.id);
      const plannerList = await getPlanner();

      const recent_memory = mems && mems.length ? mems[mems.length - 1] : {
        title: 'No memories yet',
        description: 'Start recording your first moment together.',
        memory_date: new Date().toISOString().split('T')[0],
        location: ''
      };

      const data = {
        relationship: { years: 0, months: 0, remaining_days: 0 },
        streak: { current: 0, longest: 0 },
        unread_messages: msgs ? msgs.length : 0,
        daily_question: { question_text: 'What made you smile today? 😊' },
        user_answer: null,
        recent_memory,
      };
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // user switching handled via `onSwitchUser` passed from App

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50">
        <motion.div className="text-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-7xl mb-4">💖</div>
          <p className="text-pink-600 font-bold text-lg">Loading your memories...</p>
        </motion.div>
      </div>
    );
  }

  const { relationship, streak, daily_question, recent_memory } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-10 left-8 text-6xl opacity-20" animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity }}>🌸</motion.div>
        <motion.div className="absolute top-20 right-10 text-5xl opacity-20" animate={{ y: [0, -18, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}>💖</motion.div>
        <motion.div className="absolute bottom-20 left-16 text-5xl opacity-20" animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, delay: 1 }}>🎀</motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-8">
        <motion.div
          className="rounded-b-3xl bg-gradient-to-r from-pink-300 via-purple-300 to-lavender-300 p-8 shadow-2xl border-b-4 border-pink-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <motion.h1
                className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700 mb-3"
                initial={{ x: -30 }}
                animate={{ x: 0 }}
              >
                💖 Niko & Kim Memories
              </motion.h1>
              <p className="text-white text-lg md:text-xl font-semibold drop-shadow">
                Together for: {relationship.years}y {relationship.months}m {relationship.remaining_days}d
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-white font-bold">You are:</label>
              <select
                value={user?.name?.toLowerCase().includes('kim') ? 'kim' : 'niko'}
                onChange={(e) => onSwitchUser && onSwitchUser(e.target.value)}
                className="rounded-full px-4 py-2 font-bold text-pink-600"
              >
                <option value="niko">Niko</option>
                <option value="kim">Kim</option>
              </select>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <motion.div
            className="rounded-3xl bg-white p-6 shadow-xl border-4 border-pink-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-pink-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Love Streak</p>
            <div className="flex items-center gap-4">
              <div className="text-6xl font-black text-pink-600">{streak.current}</div>
              <div>
                <p className="text-gray-800 font-bold">days in a row</p>
                <p className="text-sm text-gray-500">Longest: {streak.longest} days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl bg-white p-6 shadow-xl border-4 border-purple-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-purple-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Today's Feeling</p>
            <select
              value={feeling}
              onChange={(e) => setFeeling(e.target.value)}
              className="w-full rounded-3xl border-2 border-purple-200 bg-pink-50 px-4 py-3 text-gray-800 font-semibold focus:border-purple-400 focus:outline-none"
            >
              {feelings.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </motion.div>

          <motion.div
            className="rounded-3xl bg-white p-6 shadow-xl border-4 border-sky-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sky-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Messages</p>
            <div className="text-5xl font-black text-sky-700">{dashboardData.unread_messages}</div>
            <p className="text-gray-500 mt-2">unread love notes</p>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.div
            className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-6 shadow-xl border-4 border-pink-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-pink-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Daily Question</p>
            <p className="text-gray-800 text-lg font-semibold mb-4">{daily_question.question_text}</p>
            <button
              onClick={() => navigate('/daily-question')}
              className="rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-white font-bold shadow-lg hover:opacity-95 transition"
            >
              Answer Today
            </button>
          </motion.div>

          <motion.div
            className="rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 p-6 shadow-xl border-4 border-yellow-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-orange-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Recent Memory</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{recent_memory.title}</h3>
            <p className="text-gray-700 mb-3">{recent_memory.description}</p>
            <p className="text-sm text-gray-500">{new Date(recent_memory.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[
            { title: 'Love Chat', emoji: '💬', description: 'Messenger-style love notes.', to: '/chat', style: 'from-purple-400 to-pink-400', border: 'border-purple-300' },
            { title: 'Memory Gallery', emoji: '📸', description: 'Relive shared moments.', to: '/memories', style: 'from-orange-400 to-red-400', border: 'border-orange-300' },
            { title: 'Love Letters', emoji: '💌', description: 'Write a special themed letter.', to: '/letters', style: 'from-pink-500 to-purple-500', border: 'border-pink-300' },
            { title: 'Shared Planner', emoji: '📅', description: 'Plan dates and dreams together.', to: '/planner', style: 'from-teal-400 to-cyan-400', border: 'border-teal-300' },
            { title: 'Invite Your Partner', emoji: '👫', description: 'Send your partner a quick invite link.', to: '/invite', style: 'from-pink-400 to-fuchsia-400', border: 'border-pink-300' },
          ].map((card, idx) => (
            <motion.div
              key={card.title}
              className="cursor-pointer"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.03 }}
              onClick={() => navigate(card.to)}
            >
              <div className={`rounded-3xl p-8 shadow-xl border-4 ${card.border} bg-gradient-to-br ${card.style} text-white`}>
                <div className="text-5xl mb-4">{card.emoji}</div>
                <h3 className="text-3xl font-black mb-2">{card.title}</h3>
                <p className="text-white/90">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
