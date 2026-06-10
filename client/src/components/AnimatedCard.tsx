import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = memo(({ 
  children, 
  delay = 0, 
  className = '',
  hover = true 
}) => {
  // Verificar se deve reduzir animações (mobile ou preferência do usuário)
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
  const shouldAnimate = !prefersReducedMotion && !isMobileDevice;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={shouldAnimate ? { 
        delay: delay * 0.1,
        duration: 0.5,
        ease: "easeOut"
      } : { duration: 0 }}
      whileHover={hover && shouldAnimate ? { 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      style={{ willChange: shouldAnimate ? 'transform, opacity' : 'auto' }}
      className={`bg-white dark:bg-gray-800 overflow-hidden shadow-xl rounded-xl transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;
