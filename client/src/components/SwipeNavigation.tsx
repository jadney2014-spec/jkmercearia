import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeNavigationProps {
  children: React.ReactNode;
  enabled?: boolean;
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  children,
  enabled = true,
  threshold = 50,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Não ativar se houver scroll horizontal ou se estiver em um input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('input, textarea, select')
      ) {
        return;
      }

      setSwipeStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      setSwipeDistance(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeStart) return;

      const deltaX = e.touches[0].clientX - swipeStart.x;
      const deltaY = e.touches[0].clientY - swipeStart.y;

      // Só processar se o movimento horizontal for maior que o vertical (swipe horizontal)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
        setSwipeDistance(deltaX);
      }
    };

    const handleTouchEnd = () => {
      if (!swipeStart) return;

      const absDistance = Math.abs(swipeDistance);

      if (absDistance >= threshold) {
        if (swipeDistance > 0) {
          // Swipe para direita (voltar)
          if (onSwipeRight) {
            onSwipeRight();
          } else if (window.history.length > 1) {
            navigate(-1);
          }
        } else {
          // Swipe para esquerda (avançar)
          if (onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      setSwipeStart(null);
      setSwipeDistance(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, swipeStart, swipeDistance, threshold, onSwipeLeft, onSwipeRight, navigate]);

  return (
    <div
      ref={containerRef}
      style={{
        transform: swipeDistance !== 0 ? `translateX(${swipeDistance * 0.3}px)` : 'translateX(0)',
        transition: swipeStart ? 'none' : 'transform 0.3s ease-out',
        opacity: swipeStart ? 1 - Math.abs(swipeDistance) / 200 : 1
      }}
    >
      {children}
    </div>
  );
};

export default SwipeNavigation;
