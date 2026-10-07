import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Clock, Users, CheckCircle, Trash2, Edit, PlusCircle, Volume2, Search, Play, Pause, PlayCircle, BarChart3, UsersRound, CalendarDays, ClipboardCheck, Ban } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  isActive: boolean;
}

interface Queue {
  _id: string;
  service: Service;
  currentTokenNumber: number;
  lastTokenNumber: number;
  status: 'active' | 'paused' | 'closed';
}

interface CustomerUser {
  _id: string;
  name: string;
  email: string;
}

interface Token {
  _id: string;
  tokenCode: string;
  tokenNumber: number;
  status: 'waiting' | 'called' | 'completed' | 'skipped' | 'cancelled' | 'expired';
  joinedAt: string;
  service: Service;
  customer: CustomerUser;
}

interface Analytics {
  total_customers: number;
  completed_count: number;
  cancelled_count: number;
  skipped_count: number;
  average_waiting_time: number;
  popular_services: Array<{ name: string; count: number }>;
  peak_hours: Array<{ hour: number; count: number }>;
}

const BusinessDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useSocket();

  // Business profile state
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoadingBiz, setIsLoadingBiz] = useState(true);

  // Profile Form state (if business not exists)
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('Hospital');
  const [bizAddress, setBizAddress] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [openHour, setOpenHour] = useState('09:00');
  const [closeHour, setCloseHour] = useState('18:00');

  // Queue status states
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeTokens, setActiveTokens] = useState<Token[]>([]);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceForCall, setSelectedServiceForCall] = useState<string>('');

  // Service Modal Form state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcDuration, setSvcDuration] = useState(15);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Error/Success state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Business Profile
  const fetchBusinessProfile = async () => {
    setIsLoadingBiz(true);
    try {
      const res = await fetch('/api/businesses/owner/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBusiness(json.data);
        fetchLiveQueue(json.data._id);
        fetchServices(json.data._id);
        fetchAnalytics(json.data._id);
      } else {
        setBusiness(null);
      }
    } catch (err) {
      console.error('Fetch business error', err);
    } finally {
      setIsLoadingBiz(false);
    }
  };

  // Register Business profile
  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: bizName,
          category: bizCategory,
          address: bizAddress,
          phone: bizPhone,
          description: bizDesc,
          operatingHours: { open: openHour, close: closeHour }
        })
      });
      const json = await res.json();
      if (json.success) {
        setBusiness(json.data);
        fetchLiveQueue(json.data._id);
        fetchServices(json.data._id);
        fetchAnalytics(json.data._id);
        setMessage({ type: 'success', text: 'Business profile created successfully!' });
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to create business profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network connection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch queues & active tokens for today
  const fetchLiveQueue = async (bizId: string) => {
    try {
      const res = await fetch(`/api/queue/live/${bizId}`);
      const json = await res.json();
      if (json.success) {
        setQueues(json.queues);
        setActiveTokens(json.activeTokens);
      }
    } catch (err) {
      console.error('Fetch live queue error', err);
    }
  };

  // Fetch services
  const fetchServices = async (bizId: string) => {
    try {
      const res = await fetch(`/api/services/business/${bizId}`);
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
        if (json.data.length > 0) {
          setSelectedServiceForCall(json.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Fetch services error', err);
    }
  };

  // Fetch daily analytics
  const fetchAnalytics = async (bizId: string) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics/business/${bizId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (err) {
      console.error('Fetch analytics error', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  // Listen for Socket.IO updates to today's queues
  useEffect(() => {
    if (socket && business) {
      // Join Room
      socket.emit('join_business', business._id);

      socket.on('queue_updated', (data: { queues: Queue[]; activeTokens: Token[] }) => {
        setQueues(data.queues);
        setActiveTokens(data.activeTokens);
        // Refresh analytics dashboard periodically
        fetchAnalytics(business._id);
      });
    }

    return () => {
      if (socket && business) {
        socket.emit('leave_business', business._id);
        socket.off('queue_updated');
      }
    };
  }, [socket, business]);

  // Call next customer in selected service queue
  const handleCallNext = async () => {
    if (!selectedServiceForCall) {
      setMessage({ type: 'error', text: 'Please configure and select a service first' });
      return;
    }
    setMessage(null);
    try {
      const res = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serviceId: selectedServiceForCall })
      });
      const json = await res.json();
      if (json.success) {
        if (json.data) {
          setMessage({ type: 'success', text: `Called Ticket ${json.data.tokenCode}!` });
          
          // Trigger local browser chime text-to-speech for Called Ticket
          try {
            const utterance = new SpeechSynthesisUtterance(`Token number ${json.data.tokenNumber} please proceed to counter.`);
            window.speechSynthesis.speak(utterance);
          } catch (e) {}

        } else {
          setMessage({ type: 'success', text: 'No customers are waiting in this queue.' });
        }
      } else {
        setMessage({ type: 'error', text: json.message || 'Call failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network connection failed' });
    }
  };

  // Complete Customer ticket
  const handleCompleteCustomer = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/queue/complete/${tokenId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Service marked completed' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Skip Customer ticket
  const handleSkipCustomer = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/queue/skip/${tokenId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Customer ticket marked skipped' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle queue paused/resume status
  const handleToggleQueue = async (queueId: string) => {
    try {
      const res = await fetch(`/api/queue/toggle/${queueId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Queue status changed successfully` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Service CRUD modal toggle
  const handleOpenAddService = () => {
    setEditingService(null);
    setSvcName('');
    setSvcDesc('');
    setSvcDuration(15);
    setShowServiceModal(true);
  };

  const handleOpenEditService = (svc: Service) => {
    setEditingService(svc);
    setSvcName(svc.name);
    setSvcDesc(svc.description);
    setSvcDuration(svc.averageDuration);
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    setMessage(null);

    const url = editingService ? `/api/services/${editingService._id}` : '/api/services';
    const method = editingService ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: business._id,
          name: svcName,
          description: svcDesc,
          averageDuration: svcDuration
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchServices(business._id);
        setShowServiceModal(false);
        setMessage({ type: 'success', text: `Service saved successfully!` });
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to save service' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (svcId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this service?')) return;
    if (!business) return;

    try {
      const res = await fetch(`/api/services/${svcId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        fetchServices(business._id);
        setMessage({ type: 'success', text: 'Service deactivated successfully' });
      } else {
        setMessage({ type: 'error', text: json.message || 'Deactivation failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection failed' });
    }
  };

  // Render registration screen if not registered
  if (isLoadingBiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Register Your Business</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set up your digital queue board so clients can search and join your services.
          </p>
        </div>

        {message && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 rounded-xl text-sm font-medium">
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegisterBusiness} className="glass-panel p-8 border rounded-2xl shadow-lg space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Business Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
              placeholder="e.g. Metro City Dental Clinic"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value)}
              >
                {['Hospital', 'Clinic', 'Bank', 'Salon', 'Restaurant', 'Government', 'Service Center', 'Retail', 'Other'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone Contact</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
                placeholder="+1 555-0100"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Full Address</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
              placeholder="101 Health Ave, Suite A"
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Opening Hour</label>
              <input
                type="time"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
                value={openHour}
                onChange={(e) => setOpenHour(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Closing Hour</label>
              <input
                type="time"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
                value={closeHour}
                onChange={(e) => setCloseHour(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-sm"
              rows={3}
              placeholder="Describe your service check-in limits..."
              value={bizDesc}
              onChange={(e) => setBizDesc(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/10 transition-all"
          >
            {isSubmitting ? 'Registering...' : 'Register Business'}
          </button>
        </form>
      </div>
    );
  }

  // Pre-process analytics data for area charts (Recharts requires specific objects)
  const chartData = analytics?.peak_hours.map(hr => ({
    name: `${hr.hour}:00`,
    count: hr.count
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{business.name} Panel</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage queue tickets, update services and monitor wait analytic insights.</p>
        </div>
        
        {/* Action selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 outline-none text-xs font-semibold"
            value={selectedServiceForCall}
            onChange={(e) => setSelectedServiceForCall(e.target.value)}
          >
            {services.map((svc) => (
              <option key={svc._id} value={svc._id}>{svc.name}</option>
            ))}
          </select>

          <button
            onClick={handleCallNext}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Next Customer</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-start space-x-3 text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/40'
        }`}>
          <Clock className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto hover:underline font-bold">Dismiss</button>
        </div>
      )}

      {/* Analytics widgets */}
      {analytics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <UsersRound className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Traffic</p>
              <h3 className="text-2xl font-extrabold">{analytics.total_customers}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-extrabold">{analytics.completed_count}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-500">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cancelled/Skipped</p>
              <h3 className="text-2xl font-extrabold">{analytics.cancelled_count + analytics.skipped_count}</h3>
            </div>
          </div>

          <div className="p-5 glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Waiting Time</p>
              <h3 className="text-2xl font-extrabold">{analytics.average_waiting_time} mins</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
      )}

      {/* Main split grid: Live Queue Dashboard vs Config Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Queue console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Live Queue Monitor</h2>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Watching live queue updates</span>
            </div>
          </div>

          {/* Active Counters card */}
          {queues.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {queues.map((q) => (
                <div key={q._id} className="p-4 glass-panel border border-slate-200/50 dark:border-slate-850 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <span className="truncate max-w-[80px]">{q.service?.name}</span>
                    <span className={`inline-flex h-2 w-2 rounded-full ${q.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-extrabold">{q.currentTokenNumber}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">serving</span>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-500">{q.lastTokenNumber}</span>
                      <span className="text-[9px] text-slate-400 ml-0.5">total</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                    <button
                      onClick={() => handleToggleQueue(q._id)}
                      className={`font-semibold hover:underline flex items-center space-x-1 ${
                        q.status === 'active' ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {q.status === 'active' ? (
                        <>
                          <Pause className="w-2.5 h-2.5" />
                          <span>Pause Queue</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5" />
                          <span>Resume Queue</span>
                        </>
                      )}
                    </button>
                    <span className="text-slate-400 capitalize">{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Waiting List */}
          <div className="glass-panel border border-slate-200/50 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
              <span className="font-bold text-slate-800 dark:text-slate-200">Waiting Customers</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                {activeTokens.length} active
              </span>
            </div>

            {activeTokens.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No clients currently waiting in the digital queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {activeTokens.map((token, index) => (
                  <div key={token._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-450">{token.tokenCode}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                          token.status === 'called'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-450'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {token.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{token.customer?.name}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-450">
                        <span>{token.service?.name}</span>
                        <span>•</span>
                        <span>Joined {new Date(token.joinedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Operator Action buttons */}
                    <div className="flex space-x-2.5 w-full sm:w-auto">
                      {token.status === 'called' ? (
                        <>
                          <button
                            onClick={() => handleCompleteCustomer(token._id)}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => handleSkipCustomer(token._id)}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Skip</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 font-semibold px-2 py-1 bg-slate-150 dark:bg-slate-900 rounded-md">
                          #{index + 1} in line
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Service CRUD & Timings configuration */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-bold text-slate-850 dark:text-slate-100">Configured Services</h3>
              <button
                onClick={handleOpenAddService}
                className="p-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                title="Add a service"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {services.map((svc) => (
                <div key={svc._id} className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/20 flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-slate-850 dark:text-slate-200">{svc.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{svc.description}</p>
                    </div>
                    <div className="flex space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditService(svc)}
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc._id)}
                        className="p-1 text-slate-500 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-900/60 pt-2">
                    <span className="text-blue-600 dark:text-blue-450 uppercase tracking-wide">
                      Duration: {svc.averageDuration} mins
                    </span>
                    <span>{svc.isActive ? 'Active' : 'Deactivated'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics charts section */}
      {analytics && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Peak Hours Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Hourly Traffic Analysis</span>
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Services Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <span>Service Breakdown Metrics</span>
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.popular_services} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Service Add/Edit Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSaveService} className="glass-panel w-full max-w-md p-6 border rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-lg font-bold">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="text-slate-500 font-bold hover:underline"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border outline-none text-sm"
                  placeholder="e.g. Card check / Consult"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Average Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-4 py-2 rounded-xl border outline-none text-sm"
                  placeholder="15"
                  value={svcDuration}
                  onChange={(e) => setSvcDuration(parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border outline-none text-sm"
                  rows={3}
                  placeholder="Short description of counter steps..."
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
            >
              {isSubmitting ? 'Saving...' : 'Save Service'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
