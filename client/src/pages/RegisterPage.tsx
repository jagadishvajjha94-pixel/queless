import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertCircle, Users, Store } from 'lucide-react';

const CATEGORIES = ['Hospital', 'Clinic', 'Bank', 'Salon', 'Restaurant', 'Government', 'Service Center', 'Retail', 'Other'];

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm';
const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'business_owner'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Shop details, only used for vendor registration
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('Clinic');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [openHour, setOpenHour] = useState('09:00');
  const [closeHour, setCloseHour] = useState('18:00');
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState(15);

  const isVendor = role === 'business_owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const shop = isVendor
      ? {
          name: shopName,
          category: shopCategory,
          address: shopAddress,
          phone: shopPhone,
          description: shopDesc,
          operatingHours: { open: openHour, close: closeHour },
          service: serviceName.trim() ? { name: serviceName.trim(), averageDuration: serviceDuration } : undefined,
        }
      : undefined;

    try {
      const res = await register(name, email, password, role, shop);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 right-0 w-2/3 aspect-square rounded-full bg-indigo-500 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-2/3 aspect-square rounded-full bg-purple-500 blur-[80px]" />
      </div>

      <div
        className={`relative z-10 w-full ${isVendor ? 'max-w-2xl' : 'max-w-md'} glass-panel p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-6 transition-all`}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{isVendor ? 'Register Your Shop' : 'Create an Account'}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {isVendor
              ? 'Create your vendor account and shop listing in one step'
              : 'Start joining queues or managing your services'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-start space-x-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Role Selector tabs */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              I want to register as a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'customer'
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('business_owner')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  role === 'business_owner'
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Store className="w-4.5 h-4.5" />
                <span>Vendor / Shop</span>
              </button>
            </div>
          </div>

          {isVendor && (
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Your account</p>
          )}

          <div className={isVendor ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            <div>
              <label className={labelClass}>{isVendor ? 'Owner Name' : 'Full Name'}</label>
              <input
                type="text"
                required
                className={inputClass}
                placeholder="Dr. Connor / Satwik"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                required
                className={inputClass}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Password (Min. 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              className={inputClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {isVendor && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Your shop</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Shop / Business Name</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    placeholder="e.g. Metro City Dental Clinic"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    disabled={isLoading}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Address</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    placeholder="101 Health Ave, Suite A"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Contact</label>
                  <input
                    type="tel"
                    required
                    className={inputClass}
                    placeholder="+91 98200 00000"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Opening Hour</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={openHour}
                    onChange={(e) => setOpenHour(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className={labelClass}>Closing Hour</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={closeHour}
                    onChange={(e) => setCloseHour(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  placeholder="What customers can expect at your shop"
                  value={shopDesc}
                  onChange={(e) => setShopDesc(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>First Service (optional)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. General Consultation"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minutes</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(Number(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>{isVendor ? 'Creating shop...' : 'Creating account...'}</span>
              </span>
            ) : isVendor ? (
              'Create Vendor Account & Shop'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-900">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
