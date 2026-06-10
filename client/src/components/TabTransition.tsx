import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SafeAnimatePresence = AnimatePresence as unknown as React.FC<React.PropsWithChildren<any>>;

interface TabTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
}

const TabTransition: React.FC<TabTransitionProps> = ({ children, transitionKey }) => {
  // Verificar se deve reduzir animações
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
  const shouldAnimate = !prefersReducedMotion && !isMobileDevice;

  return (
    <SafeAnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldAnimate ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
        transition={shouldAnimate ? {
          duration: 0.2,
          ease: "easeInOut"
        } : { duration: 0 }}
        style={{ willChange: shouldAnimate ? 'transform, opacity' : 'auto' }}
        className="w-full"
      >
        {children}
      </motion.div>
    </SafeAnimatePresence>
  );
};

export default TabTransition;
