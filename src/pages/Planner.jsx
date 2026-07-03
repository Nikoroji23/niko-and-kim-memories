import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { createPlan, deletePlan, listPlans, normalizeChecklist, subscribeToSharedTable, updatePlan } from '../utils/sharedData';

function Planner({ user }) {
  const [plans, setPlans] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newStartDate && newEndDate && newEndDate < newStartDate) setNewEndDate(newStartDate);
  }, [newStartDate, newEndDate]);

  const fetchPlans = useCallback(async () => {
    try {
      const rows = await listPlans();
      setPlans(rows.map((plan) => ({ ...plan, checklist: normalizeChecklist(plan.checklist) })));
    } catch (err) {
      console.error(err);
      setError('Unable to load shared plans. Run the Supabase schema and check Netlify env vars.');
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    const unsubscribe = subscribeToSharedTable('shared_plans', fetchPlans);
    const interval = setInterval(fetchPlans, 7000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchPlans]);

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

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 }),
  });
  const selectedStart = parseDateString(newStartDate);
  const selectedEnd = parseDateString(newEndDate);

  const planEventsForDate = (date) => plans.filter((plan) => {
    const interval = getPlanInterval(plan);
    return interval && isWithinInterval(date, interval);
  });

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

  const addChecklistItem = () => {
    const trimmed = newChecklistItem.trim();
    if (!trimmed) return;
    setNewChecklistItems((items) => [...items, { text: trimmed, completed: false }]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (index) => {
    setNewChecklistItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addPlan = async (event) => {
    event.preventDefault();
    setError('');

    if (!newTitle.trim()) return setError('Enter a plan title.');
    if (!newStartDate) return setError('Select a start date.');
    if (!newEndDate) return setError('Select an end date.');
    if (newEndDate < newStartDate) return setError('End date must be the same day or after the start date.');

    setLoading(true);
    try {
      const saved = await createPlan(user, {
        title: newTitle.trim(),
        start_date: newStartDate,
        end_date: newEndDate,
        memo: newMemo.trim(),
        checklist: newChecklistItems,
      });
      setPlans((prev) => [{ ...saved, checklist: normalizeChecklist(saved.checklist) }, ...prev]);
      setSuccess('Plan added and synced.');
      setNewTitle('');
      setNewStartDate('');
      setNewEndDate('');
      setNewMemo('');
      setNewChecklistItem('');
      setNewChecklistItems([]);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Unable to add the plan. Check Supabase tables and policies.');
    } finally {
      setLoading(false);
    }
  };

  const beginEdit = (plan) => {
    setEditingId(plan.id);
    setEditDraft({
      title: plan.title || '',
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      memo: plan.memo || '',
      checklistText: normalizeChecklist(plan.checklist).map((item) => `${item.completed ? '[x]' : '[ ]'} ${item.text}`).join('\n'),
    });
  };

  const parseChecklistText = (text) => text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      completed: /^\[x\]/i.test(line),
      text: line.replace(/^\[[ x]\]\s*/i, ''),
    }));

  const saveEdit = async (id) => {
    if (!editDraft?.title.trim()) return setError('Plan title cannot be empty.');
    setLoading(true);
    setError('');
    try {
      const saved = await updatePlan(user, id, {
        title: editDraft.title.trim(),
        start_date: editDraft.start_date,
        end_date: editDraft.end_date,
        memo: editDraft.memo,
        checklist: parseChecklistText(editDraft.checklistText || ''),
      });
      setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...saved, checklist: normalizeChecklist(saved.checklist) } : plan)));
      setEditingId(null);
      setEditDraft(null);
      setSuccess('Plan updated.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Unable to update this plan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = async (plan, index) => {
    const checklist = normalizeChecklist(plan.checklist).map((item, itemIndex) => (
      itemIndex === index ? { ...item, completed: !item.completed } : item
    ));
    setPlans((prev) => prev.map((row) => (row.id === plan.id ? { ...row, checklist } : row)));
    try {
      await updatePlan(user, plan.id, { checklist });
    } catch (err) {
      console.error(err);
      setError('Unable to sync checklist update.');
      fetchPlans();
    }
  };

  const removePlan = async (id) => {
    setLoading(true);
    setError('');
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    } catch (err) {
      console.error(err);
      setError('Unable to delete this plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-lavender-50 p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/dashboard" className="text-pink-600 font-bold hover:underline text-lg mb-4 inline-block">Back to Dashboard</Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">Shared Planner</h1>
            <p className="text-gray-600 text-lg">Create, edit, and check off future plans together.</p>
          </div>
        </motion.div>

        <motion.div className="bg-white rounded-3xl shadow-lg p-8 border-3 border-sky-200 mb-8 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SanrioCornerDecoration position="top-left" size="md" />
          <SanrioCornerDecoration position="top-right" size="md" />
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-sky-600 mb-2">Plan Something Together</h2>
            <p className="text-slate-500 text-sm">Select dates, add details, and both of you will see it.</p>
          </div>

          {error && <div className="mb-4 rounded-2xl bg-red-50 border-l-4 border-red-400 p-4 text-red-700 font-medium">{error}</div>}
          {success && <div className="mb-4 rounded-2xl bg-green-50 border-l-4 border-green-400 p-4 text-green-700 font-medium">{success}</div>}

          <form onSubmit={addPlan} className="grid gap-6 lg:grid-cols-[1.2fr_1.2fr]">
            <div className="space-y-5">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 px-5 py-3 bg-sky-50 focus:border-sky-400 focus:outline-none" placeholder="Plan title" required />
              <textarea rows="4" value={newMemo} onChange={(e) => setNewMemo(e.target.value)} className="w-full rounded-2xl border-2 border-sky-200 px-5 py-3 bg-sky-50 focus:border-sky-400 focus:outline-none resize-none" placeholder="Notes, ideas, or details" />
              <div className="flex gap-3">
                <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} className="flex-1 rounded-2xl border-2 border-sky-200 px-5 py-3 bg-white focus:border-sky-400 focus:outline-none" placeholder="Checklist item" />
                <button type="button" onClick={addChecklistItem} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold px-6 py-3 hover:opacity-90 transition">Add</button>
              </div>
              {newChecklistItems.length > 0 && (
                <div className="space-y-2 bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-2xl border border-cyan-200">
                  {newChecklistItems.map((item, index) => (
                    <div key={`${item.text}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-2 border border-cyan-100">
                      <span className="text-slate-700">{item.text}</span>
                      <button type="button" onClick={() => removeChecklistItem(index)} className="text-sm text-red-500 hover:text-red-700 font-semibold">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 border-2 border-cyan-300 p-5 text-center">
                <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Selected Dates</p>
                <p className="text-2xl font-bold text-cyan-700">{newStartDate && newEndDate ? `${newStartDate} to ${newEndDate}` : 'Pick dates on calendar'}</p>
              </div>
              <button type="submit" disabled={loading || !newStartDate || !newEndDate} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold py-4 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                {loading ? 'Saving...' : 'Add Shared Plan'}
              </button>
            </div>

            <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <button type="button" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="rounded-full border-2 border-sky-300 bg-white px-3 py-2 text-slate-600 hover:bg-sky-50 font-bold">Prev</button>
                <div className="text-xl font-bold text-slate-800">{format(calendarMonth, 'MMMM yyyy')}</div>
                <button type="button" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="rounded-full border-2 border-sky-300 bg-white px-3 py-2 text-slate-600 hover:bg-sky-50 font-bold">Next</button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-600 mb-3 uppercase tracking-wide">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => <div key={label} className="py-2">{label}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const events = planEventsForDate(day);
                  const inRange = selectedStart && selectedEnd && isWithinInterval(day, { start: selectedStart, end: selectedEnd });
                  const isStart = selectedStart && isSameDay(day, selectedStart);
                  const isEnd = selectedEnd && isSameDay(day, selectedEnd);
                  const isCurrentMonth = isSameMonth(day, calendarMonth);
                  let buttonClass = 'rounded-xl border-2 p-2 text-left transition font-semibold ';
                  if (isStart || isEnd) buttonClass += 'border-cyan-600 bg-cyan-400 text-white shadow-md';
                  else if (inRange) buttonClass += 'border-cyan-400 bg-cyan-100 text-slate-800';
                  else if (isCurrentMonth) buttonClass += 'border-sky-200 bg-white text-slate-800 hover:border-cyan-400 hover:bg-cyan-50';
                  else buttonClass += 'border-transparent bg-slate-100 text-slate-400 cursor-default';
                  return (
                    <button type="button" key={day.toISOString()} onClick={() => handleDayClick(day)} disabled={!isCurrentMonth} className={buttonClass}>
                      <div className="text-sm">{format(day, 'd')}</div>
                      {events.slice(0, 1).map((plan) => <span key={plan.id} className="block rounded text-[9px] bg-slate-300 text-slate-700 px-1 py-0.5 truncate">{plan.title}</span>)}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
          <SanrioCornerDecoration position="bottom-left" size="md" />
          <SanrioCornerDecoration position="bottom-right" size="md" />
        </motion.div>

        <motion.div className="bg-white rounded-3xl shadow-lg p-8 border-3 border-cyan-200" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-cyan-600 mb-6">Future Plans</h2>
          {plans.length === 0 ? <p className="text-gray-500">No future plans yet. Add one above.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const checklist = normalizeChecklist(plan.checklist);
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-2xl p-5 shadow-sm">
                    {editingId === plan.id ? (
                      <div className="space-y-3">
                        <input value={editDraft.title} onChange={(e) => setEditDraft((draft) => ({ ...draft, title: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="date" value={editDraft.start_date} onChange={(e) => setEditDraft((draft) => ({ ...draft, start_date: e.target.value }))} className="rounded-xl border border-cyan-200 px-3 py-2" />
                          <input type="date" value={editDraft.end_date} onChange={(e) => setEditDraft((draft) => ({ ...draft, end_date: e.target.value }))} className="rounded-xl border border-cyan-200 px-3 py-2" />
                        </div>
                        <textarea value={editDraft.memo} onChange={(e) => setEditDraft((draft) => ({ ...draft, memo: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2" rows="3" />
                        <textarea value={editDraft.checklistText} onChange={(e) => setEditDraft((draft) => ({ ...draft, checklistText: e.target.value }))} className="w-full rounded-xl border border-cyan-200 px-3 py-2" rows="4" placeholder="[ ] Pack snacks" />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(plan.id)} className="rounded-xl bg-cyan-600 px-4 py-2 text-white font-bold">Save</button>
                          <button type="button" onClick={() => { setEditingId(null); setEditDraft(null); }} className="rounded-xl bg-white px-4 py-2 text-cyan-700 font-bold border border-cyan-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">{plan.title}</h3>
                            <p className="text-gray-600">{plan.start_date} to {plan.end_date}</p>
                          </div>
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700">{plan.created_by_name || 'Niko'}</span>
                        </div>
                        {plan.memo && <p className="mt-3 text-gray-700">{plan.memo}</p>}
                        {checklist.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {checklist.map((item, index) => (
                              <label key={`${plan.id}-${index}`} className="flex items-start gap-2 rounded-xl bg-white/80 p-2 text-gray-700">
                                <input type="checkbox" checked={item.completed} onChange={() => toggleChecklistItem(plan, index)} className="mt-1" />
                                <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.text}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        <p className="mt-4 text-xs text-slate-500">Last updated by {plan.updated_by_name || plan.created_by_name || 'Niko'}</p>
                        <div className="mt-4 flex gap-2">
                          <button type="button" onClick={() => beginEdit(plan)} className="rounded-xl bg-cyan-600 px-4 py-2 text-white font-bold">Edit</button>
                          <button type="button" onClick={() => removePlan(plan.id)} className="rounded-xl bg-white px-4 py-2 text-red-600 font-bold border border-red-200">Delete</button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Planner;
