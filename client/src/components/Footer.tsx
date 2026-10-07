import React from 'react';
import { Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200">QueueLess</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; 2026 QueueLess. Build with care for a seamless waiting experience.
          </p>
          <div className="flex space-x-6 text-sm text-slate-500 dark:text-slate-400">
            <a href="#privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-blue-500 transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-blue-500 transition-colors">Contact Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
