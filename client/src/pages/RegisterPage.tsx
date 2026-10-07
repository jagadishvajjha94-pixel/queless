import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertCircle, Users, Briefcase } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'business_owner'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await register(name, email, password, role);
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

      <div className="relative z-10 w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create an Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Start joining queues or managing your services
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
                <Briefcase className="w-4.5 h-4.5" />
                <span>Owner</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Dr. Connor / Satwik"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password (Min. 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Creating account...</span>
              </span>
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
