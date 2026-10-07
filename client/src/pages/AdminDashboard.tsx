import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Briefcase, RefreshCw, BarChart, ToggleLeft, ToggleRight, CheckCircle, Ban, Ticket } from 'lucide-react';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface BusinessItem {
  _id: string;
  name: string;
  category: string;
  address: string;
  isSuspended: boolean;
  owner: {
    name: string;
    email: string;
  };
}

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalTokens: number;
  activeTokensCount: number;
  completedTokensCount: number;
  categoriesStats: Array<{ category: string; count: number }>;
}

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();

  // Metrics state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/analytics/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Fetch admin stats error', err);
    }
  };

  const fetchAllBusinesses = async () => {
    try {
      const res = await fetch('/api/businesses/admin/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setBusinesses(json.data);
      }
    } catch (err) {
      console.error('Fetch all businesses admin error', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAdminStats(), fetchAllBusinesses()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspend = async (bizId: string) => {
    try {
      const res = await fetch(`/api/businesses/${bizId}/suspend`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Business suspension toggled: ${json.data.name}`);
        fetchAllBusinesses();
        fetchAdminStats();
      }
    } catch (err) {
      console.error('Toggle suspend failed', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span>Platform Admin Control</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor system metrics, review registered businesses, and toggle account states.</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title="Reload system metrics"
        >
          <RefreshCw className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-sm font-semibold flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="hover:underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Stats Widgets */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 glass-panel rounded-2xl border shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Accounts</p>
              <h3 className="text-2xl font-extrabold">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Providers</p>
              <h3 className="text-2xl font-extrabold">{stats.totalBusinesses}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Queue Tokens</p>
              <h3 className="text-2xl font-extrabold">{stats.totalTokens}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600">
              <BarChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active/Waiting Tokens</p>
              <h3 className="text-2xl font-extrabold">{stats.activeTokensCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Businesses Administration panel */}
      <div className="glass-panel border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
          <h2 className="font-bold text-slate-800 dark:text-slate-200">Registered Service Providers</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-400 uppercase bg-slate-50/20">
                <th className="p-4">Business Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Owner Profile</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {businesses.map((biz) => (
                <tr key={biz._id} className="text-sm hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="p-4 font-bold text-slate-850 dark:text-slate-200">{biz.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-150 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {biz.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs">{biz.owner?.name || 'No Owner'}</p>
                      <p className="text-[10px] text-slate-450">{biz.owner?.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      biz.isSuspended
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                    }`}>
                      {biz.isSuspended ? (
                        <>
                          <Ban className="w-3 h-3" />
                          <span>Suspended</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleSuspend(biz._id)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        biz.isSuspended
                          ? 'border-emerald-200 text-emerald-650 hover:bg-emerald-50'
                          : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      {biz.isSuspended ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Activate</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 animate-pulse" />
                          <span>Suspend</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
