import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// client-side only: store answers in localStorage

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const API_URL = `${API_BASE_URL}/api/dashboard.php`;

function DailyQuestion({ user }) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [question, setQuestion] = useState({ question_text: 'What made you smile today? 😊' });
  const [previousAnswers, setPreviousAnswers] = useState([]);

  const fetchQuestion = async () => {
    try {
      // load previous answers from localStorage
      const key = `daily_answers_${user?.id}`;
      const stored = localStorage.getItem(key);
      if (stored) setPreviousAnswers(JSON.parse(stored));
    } catch (err) {
      console.error('Failed to fetch question:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchQuestion();
    }
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!answer.trim()) {
      setError('Please write an answer before submitting.');
      return;
    }

    setLoading(true);
    try {
      const key = `daily_answers_${user?.id}`;
      const item = { id: Date.now(), answer: answer.trim(), answered_at: new Date().toISOString() };
      const stored = localStorage.getItem(key);
      const arr = stored ? JSON.parse(stored) : [];
      const next = [item, ...arr];
      localStorage.setItem(key, JSON.stringify(next));
      setPreviousAnswers(next);
      setSuccess('✨ Your answer has been saved! Way to go! 💫');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Unable to save answer. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="text-center">
            <motion.div className="text-6xl mb-3 inline-block" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              ✨
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Today's Question
            </h1>
            <p className="text-gray-600 text-lg">Take a moment to reflect and share your thoughts 💭</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-pink-200 mb-8"
        >
          <div className="mb-8">
            <motion.div 
              className="inline-block text-5xl mb-4" 
              animate={{ rotate: [0, 10, -10, 0] }} 
              transition={{ duration: 2, repeat: Infinity }}
            >
              💭
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-relaxed">
              {question.question_text}
            </h2>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700 font-semibold"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-bold mb-3">Your Reflection</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6}
                  className="w-full rounded-3xl border-2 border-pink-200 p-5 bg-pink-50 focus:border-pink-400 focus:outline-none text-gray-800 text-lg"
                  placeholder="Share your thoughts, feelings, or anything that made you smile today..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500 text-white font-bold py-4 text-lg hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? '💾 Saving...' : '✨ Save My Answer'}
                </button>
                <Link
                  to="/dashboard"
                  className="rounded-3xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-8 text-lg transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </motion.div>

        {previousAnswers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-xl p-8 border-4 border-purple-200"
          >
            <h3 className="text-2xl font-bold text-purple-700 mb-6">📖 Your Past Reflections</h3>
            <div className="space-y-4">
              {previousAnswers.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl bg-white p-4 border-2 border-purple-200"
                >
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(item.answered_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-gray-800 leading-relaxed">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DailyQuestion;
