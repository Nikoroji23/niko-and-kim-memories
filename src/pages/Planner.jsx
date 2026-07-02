import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPlanner, addPlan as addPlanToDB, updatePlanner } from '../utils/localDB';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { SanrioCornerDecoration } from '../components/SanrioDecorations';

// Using client-side IndexedDB storage; no server API

function Planner({ user }) {
  const [planner, setPlanner] = useState({ tasks: [], plans: [] });
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [error, setError] = useState('');
  const [planEditError, setPlanEditError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanDraft, setEditPlanDraft] = useState(null);
  const [newEditChecklistItem, setNewEditChecklistItem] = useState('');

  useEffect(() => {
    if (newStartDate && newEndDate && newEndDate < newStartDate) {
      setNewEndDate(newStartDate);
    }
  }, [newStartDate, newEndDate]);

  const parseDateString = (value) => {
    if (!value) return null;
    const parsed = parseISO(value);
    return parsed instanceof Date && !isNaN(parsed) ? parsed : null;
  };

  const getPlanInterval = (plan) => {
    const start = parseDateString(plan.start_date);
    const end = parseDateString(plan.end_date);
    return start && end ? { start, end } : null;
  };

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const selectedStart = parseDateString(newStartDate);
  const selectedEnd = parseDateString(newEndDate);

  const planEventsForDate = (date) => {
    return planner.plans.filter((plan) => {
      const interval = getPlanInterval(plan);
      return interval && isWithinInterval(date, interval);
    });
  };

  const isInSelectedRange = (date) => {
    return selectedStart && selectedEnd && isWithinInterval(date, { start: selectedStart, end: selectedEnd });
  };

  const handleDayClick = (date) => {
    const dateValue = format(date, 'yyyy-MM-dd');
    if (!newStartDate || (newStartDate && newEndDate)) {
      setNewStartDate(dateValue);
      setNewEndDate('');
      return;
    }

    if (dateValue < newStartDate) {
      setNewStartDate(dateValue);
      setNewEndDate(newStartDate);
    } else {
      setNewEndDate(dateValue);
    }
  };

  const fetchPlanner = async () => {
    try {
      const list = await getPlanner();
      if (list && list.length > 0) {
        // use the first planner record
        setPlanner(list[0]);
      } else {
        setPlanner({ tasks: [], plans: [] });
      }
    } catch (err) {
      console.error('Planner fetch error:', err);
      if (!err.response) {
        setError('Network error: cannot reach backend. Start the API server with `npm run serve:api`.');
      }
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlanner();
    }
  }, [user?.id]);

  const toggleTask = async (taskId) => {
    try {
      const updated = { ...planner };
      updated.tasks = (updated.tasks || []).map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      setPlanner(updated);
      if (updated.id) await updatePlanner(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const addPlan = async (e) => {
    e.preventDefault();
    setError('');

    if (!newTitle.trim()) {
      setError('Enter a plan title.');
      return;
    }

    if (!newStartDate) {
      setError('Select a check-in date.');
      return;
    }

    if (!newEndDate) {
      setError('Select a check-out date.');
      return;
    }

    if (newEndDate < newStartDate) {
      setError('Check-out must be the same day or after check-in.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: newTitle.trim(),
        start_date: newStartDate,
        end_date: newEndDate,
        memo: newMemo.trim(),
        checklist: newChecklistItems.map((item) => item.text),
        tasks: planner.tasks || [],
        plans: planner.plans || [],
      };
      if (planner && planner.id) {
        const newPlan = { title: payload.title, start_date: payload.start_date, end_date: payload.end_date, memo: payload.memo, checklist: payload.checklist, created_at: new Date().toISOString(), created_by: { id: user.id, name: user.name } };
        const updated = { ...planner, plans: [newPlan, ...(planner.plans || [])] };
        await updatePlanner(updated);
        setPlanner(updated);
      } else {
        const record = await addPlanToDB({ tasks: payload.tasks, plans: [{ title: payload.title, start_date: payload.start_date, end_date: payload.end_date, memo: payload.memo, checklist: payload.checklist, created_by: { id: user.id, name: user.name } }] }, { id: user.id, name: user.name });
        setPlanner(record);
      }
      setSuccess(`✅ Trip added!`);
      setNewTitle('');
      setNewStartDate('');
      setNewEndDate('');
      setNewMemo('');
      setNewChecklistItem('');
      setNewChecklistItems([]);
      setCalendarMonth(new Date());
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message || 'Unable to add the plan.');
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    const trimmed = newChecklistItem.trim();
    if (!trimmed) return;
    setNewChecklistItems((items) => [...items, { id: Date.now(), text: trimmed }]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (itemId) => {
    setNewChecklistItems((items) => items.filter((item) => item.id !== itemId));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="text-center">
            <motion.div className="text-6xl mb-3 inline-block" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              📅
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Shared Planner
            </h1>
            <p className="text-gray-600 text-lg">Track your tasks and future plans together 💑</p>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {['niko', 'kim'].map((owner, idx) => (
            <div key={owner} className="bg-white rounded-3xl p-6 border-2 border-cyan-200 shadow-md">
              <h3 className="text-2xl font-bold text-cyan-600 mb-4">{owner === 'niko' ? '💙 Niko' : '💗 Kim'}'s Day</h3>
              <ul className="space-y-3">
                {planner.tasks
                  .filter((task) => task.owner === owner)
                  .map((task) => (
                    <li key={task.id} className="flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-teal-50 p-3 rounded-lg">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'} font-medium`}>{task.label}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-sky-200 mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SanrioCornerDecoration position="top-left" size="md" />
          <SanrioCornerDecoration position="top-right" size="md" />
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-sky-600 mb-2">🗓️ Plan Your Trip</h2>
            <p className="text-slate-500 text-sm">Select dates on the calendar, add details, and we'll send you an email reminder</p>
          </div>

          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700 font-medium">{error}</div>}
          {success && <div className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700 font-medium">{success}</div>}

          <form onSubmit={addPlan} className="grid gap-6 lg:grid-cols-[1.2fr_1.2fr]">
            {/* Left Column: Form */}
            <div className="space-y-5">
              {/* Title Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">✈️ Trip Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-2xl border-2 border-sky-200 px-5 py-3 bg-sky-50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50 transition"
                  placeholder="e.g., Laguna Vacation"
                  required
                />
              </div>

              {/* Memo Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">📝 Memo / Notes</label>
                <textarea
                  rows="4"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  className="w-full rounded-2xl border-2 border-sky-200 px-5 py-3 bg-sky-50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50 transition resize-none"
                  placeholder="What should we do? Any special plans?"
                />
              </div>

              {/* Checklist Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">✅ Things to Do</label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="flex-1 rounded-2xl border-2 border-sky-200 px-5 py-3 bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50 transition"
                    placeholder="Add task..."
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold px-6 py-3 hover:opacity-90 hover:shadow-lg transition"
                  >
                    + Add
                  </button>
                </div>
                {newChecklistItems.length > 0 && (
                  <div className="space-y-2 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-2xl border border-cyan-200">
                    {newChecklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-2 border border-cyan-100 hover:border-cyan-300 transition"
                      >
                        <span className="text-slate-700 flex items-center gap-2">
                          <span className="text-cyan-500">✓</span>
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-sm text-red-500 hover:text-red-700 font-semibold transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Dates Display */}
              <div className="rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 border-2 border-cyan-300 p-5 text-center">
                <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Selected Dates</p>
                <p className="text-2xl font-bold text-cyan-700">
                  {newStartDate && newEndDate ? (
                    <>
                      {newStartDate} <span className="mx-2">→</span> {newEndDate}
                    </>
                  ) : (
                    '👈 Pick dates on calendar'
                  )}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !newStartDate || !newEndDate}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold py-4 hover:opacity-90 hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? '⏳ Sending Email...' : '✉️ Add Trip Plan & Email'}
              </button>
            </div>

            {/* Right Column: Calendar */}
            <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="rounded-full border-2 border-sky-300 bg-white px-3 py-2 text-slate-600 hover:bg-sky-50 hover:border-sky-400 transition font-bold"
                >
                  ‹
                </button>
                <div className="text-xl font-bold text-slate-800">{format(calendarMonth, 'MMMM yyyy')}</div>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="rounded-full border-2 border-sky-300 bg-white px-3 py-2 text-slate-600 hover:bg-sky-50 hover:border-sky-400 transition font-bold"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <div key={label} className="py-2">{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const events = planEventsForDate(day);
                  const inRange = isInSelectedRange(day);
                  const isStart = selectedStart && isSameDay(day, selectedStart);
                  const isEnd = selectedEnd && isSameDay(day, selectedEnd);
                  const isCurrentMonth = isSameMonth(day, calendarMonth);

                  let buttonClass = 'rounded-xl border-2 p-2 text-left transition font-semibold ';
                  if (isStart || isEnd) {
                    buttonClass += 'border-cyan-600 bg-cyan-400 text-white shadow-md';
                  } else if (inRange) {
                    buttonClass += 'border-cyan-400 bg-cyan-100 text-slate-800';
                  } else if (isCurrentMonth) {
                    buttonClass += 'border-sky-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50';
                  } else {
                    buttonClass += 'border-transparent bg-slate-100 text-slate-400 cursor-default';
                  }

                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      disabled={!isCurrentMonth}
                      className={buttonClass}
                    >
                      <div className="text-sm">{format(day, 'd')}</div>
                      <div className="mt-1">
                        {events.slice(0, 1).map((plan) => (
                          <span key={plan.id} className="block rounded text-[9px] bg-slate-300 text-slate-700 px-1 py-0.5 truncate">
                            {plan.title}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white border border-sky-200">
                <p className="text-xs font-bold text-slate-700 uppercase mb-2">📅 How to use</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click your first date for check-in, then click another for check-out. Your dates will highlight in blue.
                </p>
              </div>
            </div>
          </form>
          
          <SanrioCornerDecoration position="bottom-left" size="md" />
          <SanrioCornerDecoration position="bottom-right" size="md" />
        </motion.div>

        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8 border-3 border-cyan-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-cyan-600 mb-6">Future Plans</h2>
          {planner.plans.length === 0 ? (
            <p className="text-gray-500">No future plans yet. Add one above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planner.plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{plan.emoji || '📅'}</span>
                      <h3 className="text-lg font-bold text-gray-800">{plan.title}</h3>
                    </div>
                    {plan.created_by && (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">
                        {plan.created_by.name}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">
                    📍 {plan.start_date && plan.end_date ? `${plan.start_date} → ${plan.end_date}` : plan.start_date || plan.end_date || plan.date || 'Soon'}
                  </p>
                  {plan.memo && <p className="mt-3 text-gray-700">{plan.memo}</p>}
                  {plan.checklist && plan.checklist.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-semibold text-sky-600 mb-2">Checklist</h4>
                      <ul className="space-y-1 text-gray-700">
                        {plan.checklist.map((item, index) => (
                          <li key={`${plan.id}-${index}`} className="flex items-start gap-2">
                            <span className="mt-1 text-lg">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Planner;
