import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPartnerName, getUserKey, listDailyAnswers, saveDailyAnswer, subscribeToSharedTable } from '../utils/sharedData';

function DailyQuestion({ user }) {
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const questionText = 'What made you smile today?';
  const userKey = getUserKey(user);
  const partnerName = getPartnerName(user);
  const today = new Date().toISOString().slice(0, 10);

  const fetchAnswers = useCallback(async () => {
    try {
      setAnswers(await listDailyAnswers());
    } catch (err) {
      console.error('Failed to fetch shared answers:', err);
      setError('Unable to load shared daily answers. Run the latest Supabase schema first.');
    }
  }, []);

  useEffect(() => {
    fetchAnswers();
    const unsubscribe = subscribeToSharedTable('shared_daily_answers', fetchAnswers);
    const interval = setInterval(fetchAnswers, 6000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchAnswers]);

  const todaysAnswers = useMemo(() => answers.filter((item) => item.answer_date === today), [answers, today]);
  const myTodayAnswer = todaysAnswers.find((item) => item.user_key === userKey);

  useEffect(() => {
    setAnswer(myTodayAnswer?.answer || '');
  }, [myTodayAnswer?.answer]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!answer.trim()) return setError('Please write an answer before submitting.');

    setLoading(true);
    try {
      const saved = await saveDailyAnswer(user, answer.trim(), questionText);
      setAnswers((prev) => [saved, ...prev.filter((item) => item.id !== saved.id && !(item.user_key === userKey && item.answer_date === today))]);
      setSuccess('Your answer synced.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Unable to save answer. Check the shared_daily_answers table and policies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">Back to Dashboard</Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">Today's Question</h1>
            <p className="text-gray-600 text-lg">Share your thought today and read {partnerName}'s.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-pink-200 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-relaxed">{questionText}</h2>
          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>}
          {success && <div className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700 font-semibold">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} className="w-full rounded-3xl border-2 border-pink-200 p-5 bg-pink-50 focus:border-pink-400 focus:outline-none text-gray-800 text-lg" placeholder="Share your thoughts, feelings, or anything that made you smile today..." />
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 text-white font-bold py-4 text-lg hover:opacity-95 transition disabled:opacity-60">
                {loading ? 'Saving...' : myTodayAnswer ? 'Update My Answer' : 'Save My Answer'}
              </button>
              <Link to="/dashboard" className="rounded-3xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 text-lg transition text-center">Cancel</Link>
            </div>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-xl p-8 border-4 border-purple-200 mb-8">
          <h3 className="text-2xl font-bold text-purple-700 mb-6">Today's Answers</h3>
          {todaysAnswers.length === 0 ? <p className="text-gray-500">No answers yet today.</p> : (
            <div className="space-y-4">
              {todaysAnswers.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-4 border-2 border-purple-200">
                  <p className="text-sm font-bold text-purple-600 mb-2">{item.user_name}</p>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {answers.length > todaysAnswers.length && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8 border-4 border-pink-200">
            <h3 className="text-2xl font-bold text-pink-700 mb-6">Past Reflections</h3>
            <div className="space-y-4">
              {answers.filter((item) => item.answer_date !== today).slice(0, 12).map((item) => (
                <div key={item.id} className="rounded-2xl bg-pink-50 p-4 border-2 border-pink-100">
                  <p className="text-sm text-gray-500 mb-2">{item.user_name} / {new Date(`${item.answer_date}T00:00:00`).toLocaleDateString()}</p>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DailyQuestion;
