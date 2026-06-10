import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = memo(({ children, className = '' }) => {
  // Verificar se deve reduzir animações
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
  const shouldAnimate = !prefersReducedMotion && !isMobileDevice;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
      transition={shouldAnimate ? { duration: 0.3, ease: "easeOut" } : { duration: 0 }}
      style={{ willChange: shouldAnimate ? 'transform, opacity' : 'auto' }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
