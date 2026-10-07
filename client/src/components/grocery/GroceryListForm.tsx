import React, { useRef, useState } from 'react';
import { ShoppingBasket, Upload, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { parseGroceryText } from './grocery';

interface GroceryListFormProps {
  businessId: string;
  businessName: string;
  onSent: (message: string) => void;
}

const GroceryListForm: React.FC<GroceryListFormProps> = ({ businessId, businessName, onSent }) => {
  const { token } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const items = parseGroceryText(text);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError('That file is too large. Please upload a text or CSV list under 200 KB.');
      return;
    }
    setError(null);
    setText((await file.text()).trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Add at least one item, one per line.');
      return;
    }
    setError(null);
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/api/grocery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessId, items, note }),
      });
      const json = await res.json();
      if (json.success) {
        setText('');
        setNote('');
        onSent(`Grocery list with ${items.length} item${items.length === 1 ? '' : 's'} sent to ${businessName}.`);
      } else {
        setError(json.message || 'Could not send your grocery list');
      }
    } catch (err) {
      setError('Network connection failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-150 dark:border-slate-900 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
          <ShoppingBasket className="w-4 h-4 text-emerald-600" />
          Send Your Grocery List
        </h3>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload file
        </button>
        <input ref={fileInput} type="file" accept=".txt,.csv,text/plain,text/csv" className="hidden" onChange={handleFile} />
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        The shop packs your items and sends you updates. One item per line, e.g. <span className="font-mono">Rice - 5 kg</span>.
      </p>

      <textarea
        rows={6}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
        placeholder={'Basmati rice - 5 kg\nMilk - 2 L\n12 eggs\nTomatoes - 1 kg'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSending}
      />

      <input
        type="text"
        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-xs"
        placeholder="Note for the shop (optional), e.g. pickup after 6 pm"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isSending}
      />

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isSending || items.length === 0}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 transition-all"
      >
        <Send className="w-3.5 h-3.5" />
        {isSending ? 'Sending...' : items.length > 0 ? `Send ${items.length} item${items.length === 1 ? '' : 's'} to shop` : 'Send to shop'}
      </button>
    </form>
  );
};

export default GroceryListForm;
