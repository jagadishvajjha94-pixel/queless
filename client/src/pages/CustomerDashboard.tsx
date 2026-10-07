import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import { Search, Clock, QrCode, Download, Trash2, Calendar, MapPin, Phone, RefreshCw, Star, Info, Bell, CheckCircle2 } from 'lucide-react';

interface Business {
  _id: string;
  name: string;
  category: string;
  address: string;
  description: string;
  phone: string;
  operatingHours: { open: string; close: string };
}

interface Service {
  _id: string;
  name: string;
  description: string;
  averageDuration: number;
}

interface Token {
  _id: string;
  tokenCode: string;
  tokenNumber: number;
  status: 'waiting' | 'called' | 'completed' | 'skipped' | 'cancelled' | 'expired';
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
  estimatedWaitTime: number;
  qrCodePath?: string;
  pdfPath?: string;
  business: Business;
  service: Service;
}

const CustomerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();

  // Active Token state
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);

  // Browse state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [history, setHistory] = useState<Token[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoadingBiz, setIsLoadingBiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch initial dashboard metrics
  const fetchActiveToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/queue/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveToken(json.data);
        setQueuePosition(json.position);
      } else {
        setActiveToken(null);
      }
    } catch (err) {
      console.error('Fetch active token error', err);
    }
  };

  const fetchBusinesses = async () => {
    setIsLoadingBiz(true);
    try {
      let url = `${API_URL}/api/businesses?limit=30`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setBusinesses(json.data);
      }
    } catch (err) {
      console.error('Fetch businesses error', err);
    } finally {
      setIsLoadingBiz(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/queue/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      }
    } catch (err) {
      console.error('Fetch history error', err);
    }
  };

  const fetchBusinessServices = async (businessId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/services/business/${businessId}`);
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      }
    } catch (err) {
      console.error('Fetch services error', err);
    }
  };

  useEffect(() => {
    fetchActiveToken();
    fetchBusinesses();
    fetchHistory();
  }, [categoryFilter, searchQuery]);

  // Handle Socket.IO events for live position/status shifts
  useEffect(() => {
    if (socket) {
      socket.on('token_status_changed', (data: { token: Token; position: number }) => {
        // Confirm this token belongs to current customer
        if (activeToken && data.token._id === activeToken._id) {
          setActiveToken(data.token);
          setQueuePosition(data.position);

          // Trigger browser audio chime or alarm if status changed to 'called'
          if (data.token.status === 'called') {
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
              audio.play();
            } catch (e) {}
          }
          
          // Refresh history if the status transitioned to final statuses
          if (['completed', 'skipped', 'cancelled', 'expired'].includes(data.token.status)) {
            setActiveToken(null);
            fetchHistory();
          }
        } else {
          // If we had no active token, check if we got one now
          fetchActiveToken();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('token_status_changed');
      }
    };
  }, [socket, activeToken]);

  // Business Detail card click handler
  const handleSelectBusiness = (biz: Business) => {
    setSelectedBusiness(biz);
    fetchBusinessServices(biz._id);
  };

  // Join Queue request
  const handleJoinQueue = async (serviceId: string) => {
    if (!selectedBusiness) return;
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: selectedBusiness._id,
          serviceId
        })
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ type: 'success', text: `Successfully joined! Token Code: ${json.data.tokenCode}` });
        setSelectedBusiness(null);
        setServices([]);
        fetchActiveToken();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Could not join queue' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network connection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Queue request
  const handleCancelQueue = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to leave the queue?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/queue/cancel/${tokenId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setActiveToken(null);
        fetchHistory();
        setActionMessage({ type: 'success', text: 'Queue cancelled successfully' });
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Cancellation failed' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network connection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Hospital', 'Clinic', 'Bank', 'Salon', 'Restaurant', 'Government', 'Service Center', 'Retail'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">Join digital queues and track your estimated waiting status live.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-semibold text-slate-500">
            {isConnected ? 'Real-time synchronization active' : 'Offline Mode'}
          </span>
          <button
            onClick={() => { fetchActiveToken(); fetchBusinesses(); fetchHistory(); }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium">{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-auto font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Active Token Tracker */}
      {activeToken ? (
        <div className={`glass-panel border-2 rounded-2xl shadow-xl overflow-hidden relative ${
          activeToken.status === 'called'
            ? 'border-blue-500 ring-2 ring-blue-500/20 animate-pulse'
            : 'border-slate-200/80 dark:border-slate-850'
        }`}>
          {activeToken.status === 'called' && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 flex items-center justify-between font-bold text-sm tracking-wide">
              <span className="flex items-center space-x-2">
                <Bell className="w-4 h-4 animate-bounce" />
                <span>YOUR TURN! Please proceed to the service counter immediately.</span>
              </span>
            </div>
          )}

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Ticket Identifier */}
            <div className="space-y-4 text-center lg:text-left">
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                Active Ticket
              </span>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold">{activeToken.business?.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">{activeToken.service?.name}</p>
              </div>
              <div className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {activeToken.tokenCode}
              </div>
              <p className="text-xs text-slate-400">Issued at {new Date(activeToken.joinedAt).toLocaleTimeString()}</p>
            </div>

            {/* Waiting Statistics */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="border-r border-slate-200 dark:border-slate-800">
                  <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {activeToken.status === 'called' ? '0' : queuePosition}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Position in Line</p>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                    {activeToken.status === 'called' ? '0' : activeToken.estimatedWaitTime}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mins Wait Est.</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full space-y-1 pt-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span>Progress</span>
                  <span>{activeToken.status === 'called' ? 'Called' : `${queuePosition} ahead`}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500" 
                    style={{ width: `${activeToken.status === 'called' ? 100 : Math.max(10, 100 - (queuePosition * 15))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* QR Code and Actions */}
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {activeToken.qrCodePath ? (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-[140px]">
                  <img src={activeToken.qrCodePath} alt="Token QR code" className="w-[120px] h-[120px]" />
                </div>
              ) : (
                <div className="w-[120px] h-[120px] border border-dashed rounded-xl flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}

              <div className="flex w-full gap-3 max-w-[280px]">
                {activeToken.pdfPath ? (
                  <a
                    href={activeToken.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-white transition-all shadow-md shadow-slate-900/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <button disabled className="flex-1 py-2.5 px-4 rounded-xl text-xs bg-slate-200 text-slate-400 cursor-not-allowed">
                    PDF Loading...
                  </button>
                )}

                <button
                  onClick={() => handleCancelQueue(activeToken._id)}
                  disabled={isSubmitting}
                  className="flex items-center justify-center space-x-1 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-950 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Leave Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 md:p-8 rounded-2xl glass-panel border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 dark:text-slate-600 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">You are not in any queue</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Search for a clinic, salon, bank or local office below to join a queue remotely and avoid physical wait times.
          </p>
        </div>
      )}

      {/* Main Grid: Browse Businesses & Services selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Businesses List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight">Browse Service Providers</h2>
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, category..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Quick Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                categoryFilter === ''
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex-shrink-0 ${
                  categoryFilter === cat
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Business cards */}
          {isLoadingBiz ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[160px] rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-8 glass-panel border rounded-2xl text-center text-slate-500">
              No active business found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businesses.map((biz) => (
                <div
                  key={biz._id}
                  onClick={() => handleSelectBusiness(biz)}
                  className={`p-5 glass-panel rounded-2xl border hover-glow cursor-pointer transition-all hover:scale-[1.01] ${
                    selectedBusiness?._id === biz._id
                      ? 'border-blue-500 ring-2 ring-blue-500/10'
                      : 'border-slate-200 dark:border-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 uppercase tracking-wider text-slate-500">
                      {biz.category}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{biz.operatingHours.open} - {biz.operatingHours.close}</span>
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100 mt-2">{biz.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {biz.description}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-900 pt-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{biz.address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Business Timings & Services list */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm space-y-6">
            {selectedBusiness ? (
              <>
                <div className="space-y-3">
                  <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-slate-50">
                    {selectedBusiness.name}
                  </h2>
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                      <span>{selectedBusiness.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
                      <span>{selectedBusiness.phone || 'No phone listed'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
                      <span>Timing: {selectedBusiness.operatingHours.open} to {selectedBusiness.operatingHours.close}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-900 pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Select a Service to Join Queue
                  </h3>
                  
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-450 dark:text-slate-500">
                      No services currently configured by the business owner.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((svc) => (
                        <div
                          key={svc._id}
                          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 hover:border-blue-500/50 transition-colors flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-slate-850 dark:text-slate-200">{svc.name}</p>
                            <p className="text-[11px] text-slate-550 dark:text-slate-400 line-clamp-1">{svc.description}</p>
                            <span className="inline-flex text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                              Duration: ~{svc.averageDuration} mins
                            </span>
                          </div>

                          <button
                            onClick={() => handleJoinQueue(svc._id)}
                            disabled={isSubmitting || !!activeToken}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-450 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 transition-all"
                            title={activeToken ? "You are already active in a queue" : "Join queue for this service"}
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm">Select a Provider</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 max-w-xs mx-auto">
                  Click on any business card to check their operating hours, services list, and join their queue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Queue History</h2>
        
        {history.length === 0 ? (
          <div className="p-6 glass-panel rounded-2xl text-center text-xs text-slate-500">
            No previous token history.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((t) => (
              <div key={t._id} className="p-4 glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-450">{t.tokenCode}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                    t.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                      : t.status === 'cancelled'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm truncate">{t.business?.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-450">{t.service?.name}</p>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-450 pt-2 border-t border-slate-100 dark:border-slate-900">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Checked in on {new Date(t.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
