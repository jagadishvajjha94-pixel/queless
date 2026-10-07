import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, Clock, ShoppingBasket, MessageSquare, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { API_URL } from '../../config';
import { GROCERY_STATUS_LABELS, GROCERY_STATUS_STYLES, GroceryList } from './grocery';

type CustomerGroceryList = GroceryList<string, { _id: string; name: string; address: string; phone: string } | null>;

const CustomerGroceryLists: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [lists, setLists] = useState<CustomerGroceryList[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/grocery/mine`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setLists(json.data);
    } catch (err) {
      console.error('Fetch grocery lists error', err);
    }
  }, [token]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists, refreshKey]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchLists();
    socket.on('grocery_list_updated', handleUpdate);
    return () => {
      socket.off('grocery_list_updated', handleUpdate);
    };
  }, [socket, fetchLists]);

  const handleCancel = async (listId: string) => {
    if (!window.confirm('Cancel this grocery list?')) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/grocery/${listId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) fetchLists();
      else setError(json.message || 'Could not cancel the list');
    } catch (err) {
      setError('Network connection failed');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
        <ShoppingBasket className="w-5 h-5 text-emerald-600" />
        My Grocery Lists
      </h2>

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      {lists.length === 0 ? (
        <div className="p-6 glass-panel rounded-2xl text-center text-xs text-slate-500">
          No grocery lists yet. Pick a Retail shop above to send your list, and the shop will pack it for you.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => {
            const latest = list.updates[list.updates.length - 1];
            const available = list.items.filter((i) => i.status === 'available').length;
            const unavailable = list.items.filter((i) => i.status === 'unavailable').length;

            return (
              <div key={list._id} className="p-5 glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-sm truncate">{list.business?.name ?? 'Shop'}</h3>
                    {list.business?.address && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {list.business.address}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">Sent {new Date(list.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${GROCERY_STATUS_STYLES[list.status]}`}>
                    {GROCERY_STATUS_LABELS[list.status]}
                  </span>
                </div>

                {latest && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs flex gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">{latest.message}</p>
                      <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">{new Date(latest.at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{list.items.length} items</span>
                    <span>
                      {available} packed{unavailable > 0 ? ` · ${unavailable} out of stock` : ''}
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-900 rounded-xl border border-slate-100 dark:border-slate-900">
                    {list.items.map((item) => (
                      <li key={item._id} className="px-3 py-2 flex items-center justify-between text-xs">
                        <span className={`flex items-center gap-2 ${item.status === 'unavailable' ? 'line-through text-slate-400' : ''}`}>
                          {item.status === 'available' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : item.status === 'unavailable' ? (
                            <X className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {item.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {list.updates.length > 1 && (
                  <details className="text-[11px] text-slate-500 dark:text-slate-400">
                    <summary className="cursor-pointer font-semibold">Update history ({list.updates.length})</summary>
                    <ol className="mt-2 space-y-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                      {list.updates.map((update, index) => (
                        <li key={index}>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{GROCERY_STATUS_LABELS[update.status]}</span>
                          {' · '}
                          {update.message}
                          <span className="text-slate-400"> ({new Date(update.at).toLocaleTimeString()})</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {list.note && <p className="text-[11px] text-slate-500 dark:text-slate-400">Your note: {list.note}</p>}

                {['submitted', 'accepted'].includes(list.status) && (
                  <button
                    onClick={() => handleCancel(list._id)}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Cancel list
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerGroceryLists;
