export function WeatherSkeleton() {
  return (
    <div className="weather-skeleton">
      {/* Header */}
      <div className="skeleton-header">
        <div className="skeleton-pill skeleton-shimmer" style={{ width: '40px' }} />
        <div className="skeleton-pill skeleton-shimmer" style={{ width: '120px' }} />
      </div>

      {/* Hero section */}
      <div className="skeleton-hero">
        <div className="skeleton-icon skeleton-shimmer" />
        <div className="skeleton-temp-group">
          <div className="skeleton-temp skeleton-shimmer" />
          <div className="skeleton-condition skeleton-shimmer" />
        </div>
      </div>

      {/* Sun times */}
      <div className="skeleton-sun-times">
        <div className="skeleton-pill skeleton-shimmer" style={{ width: '60px' }} />
        <div className="skeleton-pill skeleton-shimmer" style={{ width: '60px' }} />
      </div>

      {/* Secondary data grid */}
      <div className="skeleton-secondary">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-data-item">
            <div className="skeleton-data-icon skeleton-shimmer" />
            <div className="skeleton-data-text">
              <div className="skeleton-line skeleton-shimmer" style={{ width: '40px' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '60px', height: '10px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="skeleton-section-title skeleton-shimmer" style={{ width: '50px' }} />

      {/* Hourly graph placeholder */}
      <div className="skeleton-graph">
        <div className="skeleton-graph-bars">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="skeleton-bar skeleton-shimmer"
              style={{ height: `${30 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="skeleton-section-title skeleton-shimmer" style={{ width: '50px' }} />

      {/* Daily forecast placeholder */}
      <div className="skeleton-daily">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-daily-row">
            <div className="skeleton-pill skeleton-shimmer" style={{ width: '50px' }} />
            <div className="skeleton-daily-icon skeleton-shimmer" />
            <div className="skeleton-daily-temps">
              <div className="skeleton-pill skeleton-shimmer" style={{ width: '30px' }} />
              <div className="skeleton-pill skeleton-shimmer" style={{ width: '30px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
