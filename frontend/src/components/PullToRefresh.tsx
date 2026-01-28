import { useState, useRef, useCallback, type ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const THRESHOLD = 70; // Pull distance to trigger refresh
const MAX_PULL = 140; // Maximum pull distance
const RESISTANCE = 1.8; // Higher = more resistance (lower = looser feel)

export function PullToRefresh({ children, onRefresh, disabled }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only enable pull-to-refresh when at the top
    if (container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance for rubber-band effect
      const resistance = 1 + (diff / MAX_PULL) * RESISTANCE;
      const distance = Math.min(diff / resistance, MAX_PULL);
      setPullDistance(distance);

      // Prevent default scroll when pulling down
      if (distance > 5) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Hold at spinner position

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, disabled]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;
  const showSpinner = pullDistance > 20 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="pull-indicator"
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: showSpinner ? 1 : 0,
        }}
      >
        <div
          className={`pull-spinner ${isRefreshing ? 'spinning' : ''}`}
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        className="pull-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
