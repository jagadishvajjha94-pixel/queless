import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      <HelpCircle className="w-16 h-16 text-slate-400 dark:text-slate-600 animate-bounce mb-4" />
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">404 - Page Not Found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all hover:scale-105"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
