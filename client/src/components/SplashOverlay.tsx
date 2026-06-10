import React, { useEffect, useMemo, useState } from 'react';

type SplashAnimation = 'none' | 'zoom' | 'pulse' | 'spin';

interface SplashOverlayProps {
  durationMs?: number;
  mediaSrc?: string;
  fallbackSrc?: string;
  backgroundColor?: string;
  animation?: SplashAnimation;
}

const SplashOverlay: React.FC<SplashOverlayProps> = ({
  durationMs = 1800,
  mediaSrc,
  fallbackSrc = '/img/ICONE-RESGATE.png',
  backgroundColor = '#1e40af',
  animation = 'zoom',
}) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>(mediaSrc || fallbackSrc);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setResolvedSrc(mediaSrc || fallbackSrc);
    setFallbackFailed(false);
  }, [mediaSrc, fallbackSrc]);

  useEffect(() => {
    const animateTimer = window.setTimeout(() => setAnimateIn(true), 30);
    const fadeTimer = window.setTimeout(() => setFadeOut(true), Math.max(0, durationMs - 350));
    const hideTimer = window.setTimeout(() => setVisible(false), durationMs);

    return () => {
      window.clearTimeout(animateTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [durationMs]);

  const animationClassName = useMemo(() => {
    if (animation === 'pulse') return 'animate-pulse';
    if (animation === 'spin') return 'animate-spin';
    return '';
  }, [animation]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor }}
      aria-label="Tela de abertura"
      role="status"
    >
      <img
        src={resolvedSrc}
        alt="Resgate"
        className={`w-40 h-40 sm:w-48 sm:h-48 object-contain ${animationClassName}`}
        style={{
          transform: animation === 'zoom' ? `scale(${animateIn ? 1 : 0.92})` : undefined,
          transition: animation === 'zoom' ? 'transform 650ms cubic-bezier(0.2, 0.9, 0.2, 1)' : undefined,
        }}
        onError={() => {
          if (resolvedSrc !== fallbackSrc) {
            setResolvedSrc(fallbackSrc);
            return;
          }

          if (!fallbackFailed) {
            setFallbackFailed(true);
            setFadeOut(true);
            window.setTimeout(() => setVisible(false), 300);
          }
        }}
      />
    </div>
  );
};

export default SplashOverlay;
