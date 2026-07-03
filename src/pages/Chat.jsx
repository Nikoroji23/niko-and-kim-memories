import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPartnerName, getUserKey, listMessages, sendMessage, subscribeToSharedTable } from '../utils/sharedData';

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userKey = getUserKey(user);
  const partnerName = getPartnerName(user);

  const fetchMessages = useCallback(async () => {
    try {
      const list = await listMessages();
      setMessages(list);
    } catch (err) {
      console.error(err);
      setError('Unable to load shared messages. Run the Supabase schema and check Netlify env vars.');
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToSharedTable('shared_messages', fetchMessages);
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchMessages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Write a message before sending.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const saved = await sendMessage(user, trimmed);
      setMessages((prev) => [...prev, saved]);
      setText('');
    } catch (err) {
      console.error(err);
      setError('Unable to send message. Check the Supabase tables and policies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-pink-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <motion.div className="text-6xl mb-3 inline-block" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                Chat
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Love Chat
              </h1>
              <p className="text-gray-600 text-lg">Signed in as {user?.name || 'Niko'}. Messages sync with {partnerName}.</p>
            </div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-pink-600 font-bold hover:underline text-lg">
              Back to Dashboard
            </Link>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
              {error}
            </motion.div>
          )}

          <div className="bg-pink-50 rounded-3xl p-6 border-2 border-pink-200 shadow-inner mb-8 h-[400px] overflow-y-auto">
            <div className="space-y-4 flex flex-col">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-16 m-auto">No messages yet. Send the first note.</div>
              ) : (
                messages.map((message) => {
                  const isSent = message.sender_key === userKey;
                  return (
                    <div
                      key={message.id}
                      className={`max-w-[80%] rounded-3xl p-4 shadow-sm transition-all ${
                        isSent
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white self-end ml-auto'
                          : 'bg-white text-gray-800 self-start border-2 border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <p className={`text-xs uppercase tracking-[0.15em] font-bold ${isSent ? 'text-white/80' : 'text-pink-600'}`}>
                          {isSent ? 'You' : message.sender_name || partnerName}
                        </p>
                        <p className={`text-[11px] ${isSent ? 'text-white/60' : 'text-gray-400'}`}>
                          {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                      <p className={`leading-relaxed ${isSent ? 'text-white' : 'text-gray-700'}`}>{message.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Write to {partnerName}</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full rounded-3xl border-2 border-pink-200 p-4 focus:border-pink-400 focus:outline-none bg-pink-50 text-gray-800"
                placeholder={`Tell ${partnerName} something sweet...`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default Chat;
