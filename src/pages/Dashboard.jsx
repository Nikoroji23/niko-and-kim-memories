import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDashboardStats, getUserKey, saveFeeling, subscribeToSharedTable } from '../utils/sharedData';

function relationshipAge() {
  const startYear = 2022;
  const startMonth = 10;
  const startDay = 23;
  const now = new Date();
  let years = now.getFullYear() - startYear;
  let months = now.getMonth() - startMonth;
  let remaining_days = now.getDate() - startDay;

  if (remaining_days < 0) {
    months -= 1;
    remaining_days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), remaining_days: Math.max(0, remaining_days) };
}

function Dashboard({ user, onSwitchUser }) {
  const [stats, setStats] = useState({ messages: [], memories: [], letters: [], unlockedLetters: [], plans: [], answers: [], feelings: [], streak: 0, recentMemory: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feeling, setFeeling] = useState('happy');
  const navigate = useNavigate();
  const userKey = getUserKey(user);

  const feelingOptions = ['happy', 'loved', 'grateful', 'excited', 'peaceful', 'missing you', 'hopeful'];

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextStats = await getDashboardStats();
      setStats(nextStats);
      const today = new Date().toISOString().slice(0, 10);
      const mine = nextStats.feelings.find((item) => item.user_key === userKey && item.feeling_date === today);
      if (mine?.feeling) setFeeling(mine.feeling);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Unable to load shared dashboard data. Run the latest Supabase schema first.');
    } finally {
      setLoading(false);
    }
  }, [userKey]);

  useEffect(() => {
    fetchDashboardData();
    const tables = ['shared_messages', 'shared_memories', 'shared_letters', 'shared_plans', 'shared_daily_answers', 'shared_feelings'];
    const unsubscribers = tables.map((table) => subscribeToSharedTable(table, fetchDashboardData));
    const interval = setInterval(fetchDashboardData, 8000);
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const relationship = relationshipAge();
  const today = new Date().toISOString().slice(0, 10);
  const todaysFeelings = useMemo(() => stats.feelings.filter((item) => item.feeling_date === today), [stats.feelings, today]);
  const recentMemory = stats.recentMemory;
  const latestMessageCount = stats.messages.length;

  const handleFeelingChange = async (value) => {
    setFeeling(value);
    try {
      const saved = await saveFeeling(user, value);
      setStats((prev) => ({ ...prev, feelings: [saved, ...prev.feelings.filter((item) => !(item.user_key === saved.user_key && item.feeling_date === saved.feeling_date))] }));
    } catch (err) {
      console.error(err);
      setError('Unable to sync today\'s feeling.');
    }
  };

  if (loading && !stats.messages.length && !stats.memories.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50">
        <motion.div className="text-center" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-7xl mb-4">Love</div>
          <p className="text-pink-600 font-bold text-lg">Loading your memories...</p>
        </motion.div>
      </div>
    );
  }

  const cards = [
    { title: 'Love Chat', description: `${latestMessageCount} shared messages.`, to: '/chat', style: 'from-purple-400 to-pink-400', border: 'border-purple-300' },
    { title: 'Memory Gallery', description: `${stats.memories.length} shared memories.`, to: '/memories', style: 'from-orange-400 to-red-400', border: 'border-orange-300' },
    { title: 'Love Letters', description: `${stats.unlockedLetters.length}/${stats.letters.length} letters open now.`, to: '/letters', style: 'from-pink-500 to-purple-500', border: 'border-pink-300' },
    { title: 'Shared Planner', description: `${stats.plans.length} future plans.`, to: '/planner', style: 'from-teal-400 to-cyan-400', border: 'border-teal-300' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 pb-16 overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 pt-8">
        <motion.div className="rounded-b-3xl bg-gradient-to-r from-pink-300 via-purple-300 to-lavender-300 p-8 shadow-2xl border-b-4 border-pink-200" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-700 to-purple-700 mb-3">Niko & Kim Memories</h1>
              <p className="text-white text-lg md:text-xl font-semibold drop-shadow">Together for: {relationship.years}y {relationship.months}m {relationship.remaining_days}d</p>
              <p className="text-white/90 text-sm md:text-base font-semibold drop-shadow mt-1">4 years on November 23, 2026</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-white font-bold">You are:</label>
              <select value={userKey} onChange={(e) => onSwitchUser && onSwitchUser(e.target.value)} className="rounded-full px-4 py-2 font-bold text-pink-600">
                <option value="niko">Niko</option>
                <option value="kim">Kim</option>
              </select>
            </div>
          </div>
        </motion.div>

        {error && <div className="mt-6 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <motion.div className="rounded-3xl bg-white p-6 shadow-xl border-4 border-pink-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-pink-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Love Streak</p>
            <div className="flex items-center gap-4"><div className="text-6xl font-black text-pink-600">{stats.streak}</div><div><p className="text-gray-800 font-bold">active days</p><p className="text-sm text-gray-500">Messages, letters, memories, or answers</p></div></div>
          </motion.div>

          <motion.div className="rounded-3xl bg-white p-6 shadow-xl border-4 border-purple-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-purple-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Today's Feelings</p>
            <select value={feeling} onChange={(e) => handleFeelingChange(e.target.value)} className="w-full rounded-3xl border-2 border-purple-200 bg-pink-50 px-4 py-3 text-gray-800 font-semibold focus:border-purple-400 focus:outline-none">
              {feelingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <div className="mt-4 space-y-2">
              {todaysFeelings.map((item) => <p key={item.id} className="rounded-2xl bg-purple-50 px-3 py-2 text-sm text-purple-700"><strong>{item.user_name}:</strong> {item.feeling}</p>)}
            </div>
          </motion.div>

          <motion.div className="rounded-3xl bg-white p-6 shadow-xl border-4 border-sky-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sky-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Messages</p>
            <div className="text-5xl font-black text-sky-700">{latestMessageCount}</div>
            <p className="text-gray-500 mt-2">shared love notes</p>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <motion.div className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-6 shadow-xl border-4 border-pink-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-pink-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Daily Question</p>
            <p className="text-gray-800 text-lg font-semibold mb-4">What made you smile today?</p>
            <p className="text-sm text-slate-500 mb-4">{stats.answers.filter((item) => item.answer_date === today).length} answers today</p>
            <button onClick={() => navigate('/daily-question')} className="rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-white font-bold shadow-lg hover:opacity-95 transition">Answer Today</button>
          </motion.div>

          <motion.div className="rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 p-6 shadow-xl border-4 border-yellow-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-orange-700 text-sm uppercase tracking-[0.3em] font-black mb-3">Recent Memory</p>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{recentMemory?.title || 'No memories yet'}</h3>
            <p className="text-gray-700 mb-3">{recentMemory ? `Saved by ${recentMemory.created_by_name}` : 'Start recording your first shared moment.'}</p>
            <p className="text-sm text-gray-500">{recentMemory?.created_at ? new Date(recentMemory.created_at).toLocaleDateString() : today}</p>
          </motion.div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {cards.map((card, idx) => (
            <motion.div key={card.title} className="cursor-pointer" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }} whileHover={{ scale: 1.03 }} onClick={() => navigate(card.to)}>
              <div className={`rounded-3xl p-8 shadow-xl border-4 ${card.border} bg-gradient-to-br ${card.style} text-white`}>
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
