export type GroceryStatus = 'submitted' | 'accepted' | 'packing' | 'ready' | 'completed' | 'rejected' | 'cancelled';
export type GroceryItemStatus = 'pending' | 'available' | 'unavailable';

export interface GroceryItem {
  _id: string;
  name: string;
  quantity: string;
  status: GroceryItemStatus;
}

export interface GroceryUpdate {
  status: GroceryStatus;
  message: string;
  at: string;
}

export interface GroceryList<Customer = string, Shop = string> {
  _id: string;
  customer: Customer;
  business: Shop;
  items: GroceryItem[];
  note: string;
  status: GroceryStatus;
  updates: GroceryUpdate[];
  createdAt: string;
  updatedAt: string;
}

export const GROCERY_STATUS_LABELS: Record<GroceryStatus, string> = {
  submitted: 'Sent to shop',
  accepted: 'Accepted',
  packing: 'Packing',
  ready: 'Ready for pickup',
  completed: 'Picked up',
  rejected: 'Declined',
  cancelled: 'Cancelled',
};

export const GROCERY_STATUS_STYLES: Record<GroceryStatus, string> = {
  submitted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  accepted: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  packing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500',
  rejected: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500',
};

export const ACTIVE_GROCERY_STATUSES: GroceryStatus[] = ['submitted', 'accepted', 'packing', 'ready'];

const parseLine = (line: string) => {
  // "Rice - 5 kg", "Milk: 2 L", "Eggs, 12"
  const separated = line.match(/^(.+?)(?:\s+[-–]\s+|\s*[:,]\s*)(.+)$/);
  if (separated) return { name: separated[1].trim(), quantity: separated[2].trim() };

  // "12 eggs", "5kg rice", "2 x bread"
  const leading = line.match(/^(\d+(?:[.,/]\d+)?\s*(?:kg|g|gm|l|ltr|ml|pcs?|dozen|packets?)?)\s+(?:x\s+)?(.+)$/i);
  if (leading) return { name: leading[2].trim(), quantity: leading[1].trim() };

  return { name: line, quantity: '' };
};

export const parseGroceryText = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
    .map(parseLine);
