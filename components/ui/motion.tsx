'use client';

import { motion } from 'framer-motion';
import React from 'react';

export const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: delay,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.4 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const AuroraBackground = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
            <div className="fixed inset-0 -z-10 h-full w-full">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.1),rgba(0,0,0,0))]"></div>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-aurora opacity-50 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_60deg,rgba(56,189,248,0.2)_120deg,rgba(168,85,247,0.2)_180deg,transparent_240deg,transparent_360deg)]"></div>
            </div>
            {children}
        </div>
    );
};
