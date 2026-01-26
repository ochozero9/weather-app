import { useRef, useEffect, useCallback } from 'react';
import { isSnowCode } from '../constants/weather';

interface DialHour {
  time: string;
  precipitation_probability: number;
  weather_code: number;
}

interface TimelineDialProps {
  hours: DialHour[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  showNowLabel?: boolean;
}

export function TimelineDial({ hours, selectedIndex, onIndexChange, showNowLabel = false }: TimelineDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startIndex = useRef(0);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const hour = date.getHours();
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  const formatDay = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDragStart = useCallback((clientX: number) => {
    isDragging.current = true;
    startX.current = clientX;
    startIndex.current = selectedIndex;
  }, [selectedIndex]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging.current) return;
    const delta = startX.current - clientX;
    const sensitivity = 8;
    const indexDelta = Math.round(delta / sensitivity);
    const newIndex = Math.max(0, Math.min(hours.length - 1, startIndex.current + indexDelta));
    onIndexChange(newIndex);
  }, [hours.length, onIndexChange]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragging.current = false; };
    const handleGlobalMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleGlobalTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchend', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [handleDragMove]);

  return (
    <div
      ref={dialRef}
      className="timeline-dial"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <div className="dial-center-indicator" />
      <div
        className="dial-track"
        style={{ transform: `translateX(calc(50% - ${selectedIndex * 70 + 35}px))` }}
      >
        {hours.map((hour, index) => {
          const distance = Math.abs(index - selectedIndex);
          const opacity = Math.max(0.3, 1 - distance * 0.12);
          const scale = Math.max(0.75, 1 - distance * 0.06);
          const hasPrecip = hour.precipitation_probability >= 30;
          const hasSnow = isSnowCode(hour.weather_code);
          return (
            <div
              key={index}
              className={`dial-item ${index === selectedIndex ? 'active' : ''}`}
              style={{ opacity, transform: `scale(${scale})` }}
              onClick={() => onIndexChange(index)}
            >
              <span className="dial-time">
                {showNowLabel && index === 0 ? 'Now' : formatTime(hour.time)}
              </span>
              <span className="dial-day">{formatDay(hour.time)}</span>
              {hasPrecip && (
                <span className={`dial-precip-dot ${hasSnow ? 'snow' : 'rain'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="dial-fade dial-fade-left" />
      <div className="dial-fade dial-fade-right" />
    </div>
  );
}
