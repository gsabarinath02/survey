'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Coffee, Bug, Skull, Heart, Sparkles, AlertTriangle, WifiOff, Server, Loader2 } from 'lucide-react';

const funnyMessages = [
  "Still broken. Have you tried turning life off and on again?",
  "Error persists. Developer is having an existential crisis.",
  "Nope. The hamster powering our servers is on vacation.",
  "Nice try! But the portfolio is still questioning its purpose.",
  "Connection refused. Portfolio has trust issues.",
  "Loading... just kidding. Nothing's happening.",
  "Error: Success not found in $PATH",
  "The server is busy contemplating the meaning of HTTP 200.",
  "Retry failed. Consider trying again in your next life.",
  "Still 503. The creator is refactoring reality itself.",
];

const errorCodes = [
  { code: "ERR_MOTIVATION_NOT_FOUND", icon: Coffee },
  { code: "ERR_SKILL_ISSUE", icon: Bug },
  { code: "ERR_LIFE_CHOICES_UNDEFINED", icon: Skull },
  { code: "ERR_IMPOSTER_SYNDROME_ACTIVE", icon: AlertTriangle },
  { code: "ERR_WIFI_IS_FINE_ITS_ME", icon: WifiOff },
  { code: "ERR_TOO_MANY_TABS_OPEN_IN_BRAIN", icon: Server },
];

export default function Home() {
  const [retryCount, setRetryCount] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const [errorCode, setErrorCode] = useState(errorCodes[0]);
  const [progressBars, setProgressBars] = useState<number[]>([]);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 150);
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(glitchInterval);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Fake loading with random progress bars
    const newBars = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => 0);
    setProgressBars(newBars);

    // Animate progress bars
    let step = 0;
    const progressInterval = setInterval(() => {
      setProgressBars(prev => prev.map((_, i) =>
        Math.min(100, (step * (15 + Math.random() * 25)) * (i === prev.length - 1 ? 0.7 : 1))
      ));
      step++;
      if (step > 8) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsRetrying(false);
          setCurrentMessage(prev => (prev + 1) % funnyMessages.length);
          setErrorCode(errorCodes[Math.floor(Math.random() * errorCodes.length)]);
          setProgressBars([]);
        }, 500);
      }
    }, 200);
  };

  const ErrorIcon = errorCode.icon;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-slate-100 font-mono relative overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)
            }}
            animate={{
              y: [null, -20, 20, -10, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glitch overlay */}
      <AnimatePresence>
        {showGlitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(6, 182, 212, 0.03) 2px,
                rgba(6, 182, 212, 0.03) 4px
              )`
            }}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl"
        >
          {/* Error icon */}
          <motion.div
            animate={{
              rotate: [0, -5, 5, -3, 0],
              scale: [1, 1.02, 0.98, 1]
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"
              />
              <Server className="w-24 h-24 text-red-500/80 relative" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Error code badge */}
          <motion.div
            key={errorCode.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-6"
          >
            <ErrorIcon className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm font-bold tracking-wider">{errorCode.code}</span>
          </motion.div>

          {/* Main error text */}
          <h1 className={`text-7xl md:text-9xl font-black mb-4 ${showGlitch ? 'text-cyan-400' : 'text-slate-200'}`}
            style={{ textShadow: showGlitch ? '2px 2px #ff0040, -2px -2px #00ffff' : 'none' }}>
            503
          </h1>

          <motion.h2
            className="text-2xl md:text-3xl font-bold text-slate-300 mb-4"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Portfolio Not Ready
          </motion.h2>

          <div className="space-y-2 mb-8">
            <p className="text-slate-500">
              <span className="text-slate-400">Reason:</span> Creator refactoring life choices
            </p>
            <p className="text-slate-500">
              <span className="text-slate-400">Temporary fix:</span> Check back soon™
            </p>
            <p className="text-slate-600 text-sm">
              (soon™ may range from 5 minutes to heat death of universe)
            </p>
          </div>

          {/* Loading bars during retry */}
          <AnimatePresence>
            {isRetrying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 space-y-2"
              >
                {progressBars.map((progress, i) => (
                  <div key={i} className="text-left">
                    <div className="text-xs text-slate-500 mb-1">
                      {['Checking if developer is awake...', 'Searching for motivation...', 'Consulting Stack Overflow...', 'Asking ChatGPT...'][i] || 'Processing...'}
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retry message */}
          {retryCount > 0 && !isRetrying && (
            <motion.p
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-amber-400/80 text-sm mb-6 italic"
            >
              "{funnyMessages[currentMessage]}"
            </motion.p>
          )}

          {/* Retry button */}
          <motion.button
            onClick={handleRetry}
            disabled={isRetrying}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group px-8 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 font-bold transition-all hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-3">
              {isRetrying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className={`w-5 h-5 ${retryCount > 0 ? 'text-amber-400' : ''}`} />
                  Retry {retryCount > 0 && `(Attempt ${retryCount + 1})`}
                </>
              )}
            </span>

            {/* Hover glow */}
            <div className="absolute inset-0 rounded-xl bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
          </motion.button>

          {/* Easter egg trigger */}
          {retryCount >= 5 && !showEasterEgg && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-slate-600 text-xs cursor-pointer hover:text-pink-400 transition-colors"
              onClick={() => setShowEasterEgg(true)}
            >
              Psst... click here for a secret 🤫
            </motion.p>
          )}

          {/* Easter egg */}
          <AnimatePresence>
            {showEasterEgg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-8 p-6 bg-pink-500/10 border border-pink-500/30 rounded-2xl"
              >
                <Heart className="w-8 h-8 text-pink-400 mx-auto mb-3" />
                <p className="text-pink-300 text-sm">
                  You really tried {retryCount} times? That's dedication! 💕
                </p>
                <p className="text-pink-400/60 text-xs mt-2">
                  (The portfolio is still not ready though lol)
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retry counter */}
          {retryCount > 0 && (
            <p className="mt-8 text-slate-600 text-xs">
              Failed attempts: {retryCount} • Success rate: 0.00%
            </p>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-center text-slate-600 text-xs"
        >
          <p>© {new Date().getFullYear()} — Error crafted with 💔 and ☕</p>
          <p className="mt-1">Server Status: <span className="text-red-400">● Crying</span></p>
        </motion.footer>
      </div>

      <style jsx global>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </main>
  );
}
