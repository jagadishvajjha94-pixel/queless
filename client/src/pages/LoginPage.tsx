import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        // Redirection logic is handled by App.tsx matching roles, but we trigger a manual reload/navigate
        navigate('/');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-0 w-2/3 aspect-square rounded-full bg-blue-500 blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-2/3 aspect-square rounded-full bg-indigo-500 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sign in to QueueLess</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your credentials to access your dashboard
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-start space-x-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-850 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-900">
          New to QueueLess?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
