import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, ShoppingBasket, Send, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { API_URL } from '../../config';
import {
  ACTIVE_GROCERY_STATUSES,
  GROCERY_STATUS_LABELS,
  GROCERY_STATUS_STYLES,
  GroceryItemStatus,
  GroceryList,
  GroceryStatus,
} from './grocery';

type ShopGroceryList = GroceryList<{ _id: string; name: string; email: string } | null, string>;

const ACTIONS: Record<GroceryStatus, Array<{ status: GroceryStatus; label: string; style: string }>> = {
  submitted: [
    { status: 'accepted', label: 'Accept list', style: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { status: 'rejected', label: 'Decline', style: 'border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20' },
  ],
  accepted: [
    { status: 'packing', label: 'Start packing', style: 'bg-amber-500 hover:bg-amber-600 text-white' },
    { status: 'ready', label: 'Mark ready', style: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { status: 'rejected', label: 'Decline', style: 'border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20' },
  ],
  packing: [
    { status: 'ready', label: 'Mark ready for pickup', style: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { status: 'rejected', label: 'Decline', style: 'border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20' },
  ],
  ready: [{ status: 'completed', label: 'Customer picked up', style: 'bg-emerald-600 hover:bg-emerald-700 text-white' }],
  completed: [],
  rejected: [],
  cancelled: [],
};

const ShopGroceryOrders: React.FC<{ businessId: string }> = ({ businessId }) => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [lists, setLists] = useState<ShopGroceryList[]>([]);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/grocery/business/${businessId}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setLists(json.data);
    } catch (err) {
      console.error('Fetch grocery orders error', err);
    }
  }, [businessId, token]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchLists();
    socket.on('grocery_list_updated', handleUpdate);
    return () => {
      socket.off('grocery_list_updated', handleUpdate);
    };
  }, [socket, fetchLists]);

  const sendUpdate = async (listId: string, update: { status?: GroceryStatus; message?: string; items?: Array<{ _id: string; status: GroceryItemStatus }> }) => {
    setBusyId(listId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/grocery/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(update),
      });
      const json = await res.json();
      if (json.success) {
        setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, ...json.data, customer: l.customer } : l)));
        if (update.status || update.message) setMessages((prev) => ({ ...prev, [listId]: '' }));
      } else {
        setError(json.message || 'Update failed');
      }
    } catch (err) {
      setError('Network connection failed');
    } finally {
      setBusyId(null);
    }
  };

  const activeLists = lists.filter((l) => ACTIVE_GROCERY_STATUSES.includes(l.status));
  const pastLists = lists.filter((l) => !ACTIVE_GROCERY_STATUSES.includes(l.status));
  const shown = tab === 'active' ? activeLists : pastLists;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBasket className="w-5 h-5 text-emerald-600" />
          Customer Grocery Lists
        </h2>
        <div className="flex gap-2">
          {(['active', 'past'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                tab === key
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {key === 'active' ? `To prepare (${activeLists.length})` : `Past (${pastLists.length})`}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      {shown.length === 0 ? (
        <div className="p-8 glass-panel rounded-2xl text-center text-sm text-slate-500">
          {tab === 'active' ? 'No grocery lists waiting. New lists from customers appear here instantly.' : 'No completed or cancelled lists yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shown.map((list) => {
            const editable = ACTIVE_GROCERY_STATUSES.includes(list.status);
            const busy = busyId === list._id;
            const message = messages[list._id] ?? '';
            const packed = list.items.filter((i) => i.status === 'available').length;
            const outOfStock = list.items.filter((i) => i.status === 'unavailable').length;

            return (
              <div key={list._id} className="p-5 glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {list.customer?.name ?? 'Customer'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{list.customer?.email}</p>
                    <p className="text-[10px] text-slate-400">Received {new Date(list.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${GROCERY_STATUS_STYLES[list.status]}`}>
                    {GROCERY_STATUS_LABELS[list.status]}
                  </span>
                </div>

                {list.note && (
                  <p className="text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Customer note:</span> {list.note}
                  </p>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{list.items.length} items</span>
                    <span>
                      {packed} packed{outOfStock > 0 ? ` · ${outOfStock} out of stock` : ''}
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-900 rounded-xl border border-slate-100 dark:border-slate-900">
                    {list.items.map((item) => (
                      <li key={item._id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                        <span className={`min-w-0 truncate ${item.status === 'unavailable' ? 'line-through text-slate-400' : ''}`}>
                          <span className="font-semibold">{item.name}</span>
                          {item.quantity && <span className="text-slate-500 dark:text-slate-400"> · {item.quantity}</span>}
                        </span>
                        {editable ? (
                          <span className="flex gap-1 flex-shrink-0">
                            <button
                              disabled={busy}
                              onClick={() => sendUpdate(list._id, { items: [{ _id: item._id, status: item.status === 'available' ? 'pending' : 'available' }] })}
                              title="Packed"
                              className={`p-1 rounded-md border transition-colors ${
                                item.status === 'available'
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => sendUpdate(list._id, { items: [{ _id: item._id, status: item.status === 'unavailable' ? 'pending' : 'unavailable' }] })}
                              title="Out of stock"
                              className={`p-1 rounded-md border transition-colors ${
                                item.status === 'unavailable'
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 capitalize">{item.status === 'unavailable' ? 'Out of stock' : item.status === 'available' ? 'Packed' : ''}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {editable && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-xs"
                      placeholder="Message to customer (optional), e.g. Paneer is out of stock, added a substitute"
                      value={message}
                      onChange={(e) => setMessages((prev) => ({ ...prev, [list._id]: e.target.value }))}
                      disabled={busy}
                    />
                    <div className="flex flex-wrap gap-2">
                      {ACTIONS[list.status].map((action) => (
                        <button
                          key={action.status}
                          disabled={busy}
                          onClick={() => sendUpdate(list._id, { status: action.status, message })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${action.style}`}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        disabled={busy || !message.trim()}
                        onClick={() => sendUpdate(list._id, { message })}
                        className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Send message
                      </button>
                    </div>
                  </div>
                )}

                {list.updates.length > 0 && (
                  <p className="text-[10px] text-slate-400">
                    Last update sent: {list.updates[list.updates.length - 1].message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopGroceryOrders;
