import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, LogOut, LayoutDashboard, Clock, Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight">
              <Clock className="w-6 h-6 stroke-[2.5] text-blue-600 dark:text-blue-400" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                QueueLess
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link
                  to={`/${user.role}-dashboard`}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize font-medium">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-200/80 dark:border-slate-800/80 px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <Link
                to={`/${user.role}-dashboard`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center space-x-1.5 px-3 py-2 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium bg-blue-600 text-white text-center hover:bg-blue-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
