import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiDollarSign, FiPlus, FiCheck, FiArrowRight,
  FiUsers, FiCreditCard, FiPieChart, FiSend
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';
import { normalizeActivity } from '../utils/normalize';

const userIdOf = (u) => (u && typeof u === 'object' ? u._id || u.id : u);

const ExpensesPage = () => {
  const { user: me } = useAuth();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseActivity, setExpenseActivity] = useState('');
  const [splitWith, setSplitWith] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await api.get('/api/activities');
      const mine = (res.data.activities || []).filter((a) =>
        a.isCreator || (a.participants || []).some((p) => String(userIdOf(p.user)) === String(me?.id))
      );
      setActivities(mine.map((a) => normalizeActivity(a)));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activitiesWithExpenses = activities.filter((a) => (a.expenses || []).length > 0);

  const splitAmount = (expense, count) => count > 0 ? Math.ceil((expense.amount || 0) / count) : 0;

  const computeBalances = () => {
    const owesMe = {};
    const iOwe = {};
    activitiesWithExpenses.forEach((a) => {
      (a.expenses || []).forEach((e) => {
        const count = (e.splitAmong || []).length;
        if (count === 0) return;
        const share = splitAmount(e, count);
        if (String(userIdOf(e.paidBy)) === String(me?.id)) {
          (e.splitAmong || []).forEach((u) => {
            const uid = String(userIdOf(u));
            if (uid === String(me?.id)) return;
            owesMe[uid] = (owesMe[uid] || 0) + share;
          });
        } else if ((e.splitAmong || []).some((u) => String(userIdOf(u)) === String(me?.id))) {
          const uid = String(userIdOf(e.paidBy));
          iOwe[uid] = (iOwe[uid] || 0) + share;
        }
      });
    });
    return { owesMe, iOwe };
  };

  const { owesMe, iOwe } = computeBalances();
  const totalOwed = Object.values(owesMe).reduce((s, v) => s + v, 0);
  const totalOwes = Object.values(iOwe).reduce((s, v) => s + v, 0);
  const net = totalOwed - totalOwes;

  const personNameById = (id) => {
    const idStr = String(id);
    for (const a of activities) {
      const found = (a.attendees || []).find((at) => String(at.id) === idStr);
      if (found) return { name: found.name, id: found.id, initial: (found.avatar || found.name[0]) };
    }
    return { name: 'Someone', id: idStr, initial: '?' };
  };

  const balances = [
    ...Object.entries(owesMe).map(([id, amount]) => ({ ...personNameById(id), amount, type: 'owes_you' })),
    ...Object.entries(iOwe).map(([id, amount]) => ({ ...personNameById(id), amount, type: 'you_owe' })),
  ];

  const openAddExpense = () => {
    const first = activitiesWithExpenses[0] || activities[0];
    if (first) setExpenseActivity(first.id);
    setShowAddExpense(true);
  };

  const allAttendees = () => {
    const a = activities.find((x) => x.id === expenseActivity);
    if (!a) return [];
    return (a.attendees || []).map((at) => ({ id: at.id, name: at.name, initial: at.avatar || at.name[0] }));
  };

  const handleSelectActivity = (id) => {
    setExpenseActivity(id);
    setSplitWith(allAttendeesOf(id));
  };

  const allAttendeesOf = (id) => {
    const a = activities.find((x) => x.id === id);
    if (!a) return [];
    return (a.attendees || []).map((at) => String(at.id));
  };

  const toggleSplit = (id) => {
    setSplitWith((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAddExpense = async () => {
    if (!expenseActivity || !expenseAmount || Number(expenseAmount) <= 0) {
      alert('Enter an amount and pick an activity');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/activities/${expenseActivity}/expenses`, {
        description: expenseDescription || 'Expense',
        amount: Number(expenseAmount),
        splitAmong: splitWith,
      });
      setShowAddExpense(false);
      setExpenseAmount('');
      setExpenseDescription('');
      setSplitWith([]);
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not add expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Split Expenses
          </h1>
          <p className="text-dark-400">Track and split bills with friends</p>
        </div>
        <button 
          onClick={openAddExpense}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="card text-center py-12 mb-6">
          <p className="text-dark-300 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      ) : (
      <>
      {/* Balance Summary */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Your Balances</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-lime-500/10 rounded-xl text-center">
            <FiDollarSign className="w-6 h-6 text-lime-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-lime-400">₹{totalOwed}</div>
            <div className="text-sm text-dark-400">You're owed</div>
          </div>
          <div className="p-4 bg-red-500/10 rounded-xl text-center">
            <FiDollarSign className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">₹{totalOwes}</div>
            <div className="text-sm text-dark-400">You owe</div>
          </div>
          <div className="p-4 bg-dark-800/50 rounded-xl text-center">
            <FiPieChart className="w-6 h-6 text-dark-400 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${net >= 0 ? 'text-white' : 'text-red-400'}`}>₹{net < 0 ? -net : net}</div>
            <div className="text-sm text-dark-400">{net >= 0 ? 'Net you\u2019re owed' : 'Net you owe'}</div>
          </div>
        </div>

        {balances.length === 0 ? (
          <p className="text-center text-dark-400 py-6">No balances yet. Split an expense to get started.</p>
        ) : (
        <div className="space-y-3">
          {balances.map((balance, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
              <RoundAvatar
                src={balance.initial}
                name={balance.name}
                gradient="from-lime-500 to-electric-500"
                className="w-10 h-10 text-sm"
              />
              <div className="flex-1">
                <h4 className="font-medium text-white">{balance.name}</h4>
                <p className="text-xs text-dark-400">
                  {balance.type === 'owes_you' ? 'owes you' : 'you owe'}
                </p>
              </div>
              <span className={`font-bold ${balance.type === 'owes_you' ? 'text-lime-400' : 'text-red-400'}`}>
                ₹{balance.amount}
              </span>
              <Link to={`/chat/${balance.id}`} className="btn-outline text-xs px-3 py-1.5">
                {balance.type === 'owes_you' ? 'Remind' : 'Pay'}
              </Link>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Recent Activities */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Splits</h2>
        {activitiesWithExpenses.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl mb-3 block">💰</span>
            <h3 className="text-lg font-bold text-white mb-2">No expenses yet</h3>
            <p className="text-dark-400">Track and split bills with your activity mates.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {activitiesWithExpenses.map((activity) => {
            const total = (activity.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
            const count = (activity.attendees || []).length;
            const share = splitAmount({ amount: total }, count);
            return (
              <div key={activity.id} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl">
                    {activity.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{activity.title}</h3>
                    <p className="text-sm text-dark-400">{activity.time}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">₹{total}</div>
                    <div className="text-xs text-dark-400">Total</div>
                  </div>
                </div>

                {/* Split Breakdown */}
                <div className="space-y-2">
                  {(activity.attendees || []).map((person, idx) => {
                    const paid = (activity.expenses || [])
                      .filter((e) => String(userIdOf(e.paidBy)) === String(person.id))
                      .reduce((s, e) => s + (e.amount || 0), 0);
                    return (
                      <div key={person.id || idx} className="flex items-center gap-3 p-2 bg-dark-800/30 rounded-lg">
                        <RoundAvatar
                          src={person.avatar}
                          name={person.name}
                          gradient="from-lime-500 to-electric-500"
                          className="w-8 h-8 text-xs"
                        />
                        <span className="flex-1 text-sm text-dark-300">{person.name}</span>
                        {paid > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-lime-500/20 text-lime-400 rounded">
                            Paid ₹{paid}
                          </span>
                        )}
                        <span className="text-sm text-dark-400">owes ₹{share}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/chat/${String(userIdOf(activity.creatorId))}`}
                    className={`flex-1 btn-outline text-sm flex items-center justify-center gap-1 ${activity.creatorId ? '' : 'opacity-50 pointer-events-none'}`}
                  >
                    <FiSend className="w-3 h-3" />
                    Settle Up
                  </Link>
                  <Link
                    to={`/activities/${activity.id}`}
                    className="flex-1 btn-outline text-sm flex items-center justify-center gap-1"
                  >
                    <FiArrowRight className="w-3 h-3" />
                    View Activity
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Add Expense</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Activity</label>
                <select
                  value={expenseActivity}
                  onChange={(e) => handleSelectActivity(e.target.value)}
                  className="input-field"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">₹</span>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-8 text-2xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="What was it for?"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Split with</label>
                <div className="space-y-2">
                  {allAttendees().map((person) => (
                    <label key={person.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl cursor-pointer hover:bg-dark-700/50">
                      <input
                        type="checkbox"
                        checked={splitWith.includes(person.id)}
                        onChange={() => toggleSplit(person.id)}
                        className="w-4 h-4 accent-lime-500"
                      />
                      <RoundAvatar
                        src={person.initial}
                        name={person.name}
                        gradient="from-lime-500 to-electric-500"
                        className="w-8 h-8 text-xs"
                      />
                      <span className="text-white">{person.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddExpense(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddExpense}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-60"
              >
                {saving ? 'Adding...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default ExpensesPage;