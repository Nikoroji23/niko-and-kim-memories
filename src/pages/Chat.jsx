import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMessages, saveMessage } from '../utils/localDB';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const API_URL = `${API_BASE_URL}/api/chat.php`;

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partnerId, setPartnerId] = useState(null);

  const senderKey = user?.name?.toLowerCase().includes('kim') ? 'kim' : 'niko';

  const fetchMessages = async () => {
    try {
      const list = await getMessages(user.id);
      setMessages(list || []);
      setPartnerId(list && list.length > 0 ? (list[0].partner_id || null) : null);
    } catch (err) {
      console.error(err);
      setError('Failed to load messages.');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!partnerId) {
      setError('You must invite and connect with a partner first!');
      return;
    }
    
    if (!text.trim()) {
      setError('Write a message before sending.');
      return;
    }
    
    setLoading(true);

    try {
      const payload = { sender: senderKey, text: text.trim(), sender_id: user.id, partner_id: user.partnerId || null, time: new Date().toLocaleTimeString() };
      const saved = await saveMessage(user.id, payload, { id: user.id, name: user.name });
      setMessages((prev) => [...prev, saved]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to send message. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isYourMessage = (senderId) => senderId === user.id;

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
                💬
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Love Chat
              </h1>
              <p className="text-gray-600 text-lg">
                {partnerId ? `Chatting with your partner 💕` : 'Connect with your partner to chat 💕'}
              </p>
            </div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-pink-600 font-bold hover:underline text-lg">
              ← Back to Dashboard
            </Link>
          </div>

          {!partnerId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 rounded-2xl bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-800"
            >
              <p className="font-semibold">💫 Not connected yet!</p>
              <p className="text-sm mt-1">Go to <Link to="/invite" className="underline font-bold">Invite</Link> to connect with your partner first.</p>
            </motion.div>
          )}

          <div className="bg-pink-50 rounded-3xl p-6 border-2 border-pink-200 shadow-inner mb-8 h-[400px] overflow-y-auto">
            <div className="space-y-4 flex flex-col">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-16 m-auto">
                  {partnerId ? '💌 No messages yet. Send the first love note!' : '👋 Waiting for partner connection...'}
                </div>
              ) : (
                messages.map((message) => {
                  const isSent = isYourMessage(message.sender_id);
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
                        <p className={`text-xs uppercase tracking-[0.15em] font-bold ${
                          isSent ? 'text-white/80' : 'text-pink-600'
                        }`}>
                          {isSent ? '💕 You' : '✨ ' + (message.sender === 'kim' ? 'Kim' : 'Niko')}
                        </p>
                        <p className={`text-[11px] ${isSent ? 'text-white/60' : 'text-gray-400'}`}>
                          {message.time}
                        </p>
                      </div>
                      <p className={`leading-relaxed mb-2 ${isSent ? 'text-white' : 'text-gray-700'}`}>
                        {message.text}
                      </p>
                      {isSent && (
                        <p className={`text-xs ${message.read_by_receiver ? 'text-white/80' : 'text-white/50'}`}>
                          {message.read_by_receiver ? '✓✓ Read' : '✓ Sent'}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Write a love message</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!partnerId}
                rows={4}
                className="w-full rounded-3xl border-2 border-pink-200 p-4 focus:border-pink-400 focus:outline-none bg-pink-50 text-gray-800 disabled:opacity-50 disabled:bg-gray-100"
                placeholder={partnerId ? "Tell them how you feel..." : "Connect with a partner first..."}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !partnerId}
              className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!partnerId ? '💔 No Partner Connected' : loading ? 'Sending...' : 'Send Love Note'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default Chat;
