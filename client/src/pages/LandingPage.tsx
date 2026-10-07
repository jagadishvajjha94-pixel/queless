import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Search, QrCode, TrendingUp, CheckCircle, ChevronDown, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const steps = [
    {
      icon: <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "1. Search Service",
      description: "Find your hospital, clinic, salon or grocery store on the platform."
    },
    {
      icon: <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "2. Join Queue Remotely",
      description: "Get a live digital queue token instantly from anywhere."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "3. Live status updates",
      description: "Watch your wait time count down in real-time on your dashboard."
    },
    {
      icon: <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "4. Show QR & Get Served",
      description: "Present your QR code ticket at the counter when you are called."
    }
  ];

  const features = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      title: "Smart Wait Time Estimator",
      description: "Calculated by our Python FIFO algorithm based on active queue counters and historical performance."
    },
    {
      icon: <QrCode className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      title: "Dynamic QR Tokens",
      description: "Generate highly accessible digital tickets with downloadable PDFs for offline check-ins."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
      title: "Peak Hours Analytics",
      description: "Advanced dashboards for business owners showing congestion hours, customer limits, and service durations."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      title: "Zero Physical Contacts",
      description: "Avoid crowded waiting rooms entirely, preserving healthcare safety and personal comfort."
    }
  ];

  const faqs = [
    {
      q: "How does the estimated wait time work?",
      a: "Our estimation engine queries active waiting lists and multiplies the count by the historical service speed of that business counter. It then applies load factors for peak times."
    },
    {
      q: "Can I cancel my place in the queue?",
      a: "Yes! You can cancel your token at any time directly from your dashboard. This automatically updates the queue position for everyone behind you instantly."
    },
    {
      q: "Is it free for businesses to sign up?",
      a: "QueueLess offers a free starter plan for single-counter businesses. We have scalable licenses for hospitals and retail chains."
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-30 dark:opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-gradient-to-tr from-blue-400 to-indigo-600 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] aspect-square rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Say goodbye to waiting in lines</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-slate-50">
              Smart Digital Queue & <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Appointment Management
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Join queues remotely, monitor live wait times, and receive instant updates. Save hours at clinics, salons and stores, or send your grocery list ahead and pick it up packed.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              {user ? (
                <Link
                  to={`/${user.role}-dashboard`}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Get Started for Free
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold glass-panel text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all hover:scale-[1.02]"
                  >
                    Register Business
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-white dark:bg-slate-900/30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">How QueueLess Works</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Zero lines. Clear visual tracking. Follow these simple steps.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                  {step.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Platform Features</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Everything you need to orchestrate a seamless service queue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feat, idx) => (
              <div key={idx} className="flex gap-4 p-6 glass-panel rounded-2xl border border-slate-100 dark:border-slate-800 hover-glow">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    {feat.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{feat.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Trusted by Services Everywhere</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Hear from managers and customers who made the digital switch.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm">
                "Our clinic waiting room went from packed to empty! Customers log in at home and arrive exactly when their token is called."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Dr
                </div>
                <div>
                  <h4 className="font-bold text-sm">Dr. Sarah Connor</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Owner, City General Clinic</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm">
                "Customers send their grocery lists before they leave home. We pack everything, tell them what's out of stock, and they just pick it up."
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  PS
                </div>
                <div>
                  <h4 className="font-bold text-sm">Priya Sharma</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Owner, FreshMart Supermarket</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm space-y-4">
              <p className="text-slate-600 dark:text-slate-300 italic text-sm">
                "The live progress bar on the dashboard is amazing. I could sip coffee in the café next door and check my queue position countdown in real time!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  SH
                </div>
                <div>
                  <h4 className="font-bold text-sm">Satwik Harpale</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Regular Customer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white dark:bg-slate-900/30 transition-colors">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Get In Touch</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Have a question or looking to customize your enterprise queue?</p>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm" rows={4} placeholder="How can we help you?"></textarea>
            </div>
            <button type="button" className="w-full py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
