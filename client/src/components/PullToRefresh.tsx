import React, { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Só ativar se estiver no topo da página
      if (window.scrollY > 10) return;
      
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;
      if (window.scrollY > 10) {
        startY.current = 0;
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        e.preventDefault();
        setIsPulling(true);
        // Limitar a distância máxima
        const maxDistance = threshold * 2;
        setPullDistance(Math.min(distance, maxDistance));
      }
    };

    const handleTouchEnd = async () => {
      if (startY.current === 0) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Erro ao atualizar:', error);
        } finally {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
          startY.current = 0;
        }
      } else {
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowSpinner = pullProgress >= 1 || isRefreshing;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold * 1.5)}px)`,
          height: `${threshold}px`
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {shouldShowSpinner ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          ) : (
            <svg
              className="w-8 h-8 text-primary-600 transition-transform"
              style={{ transform: `rotate(${pullProgress * 180}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {isRefreshing ? 'Atualizando...' : 'Solte para atualizar'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, threshold)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
