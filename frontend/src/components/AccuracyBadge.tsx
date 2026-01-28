interface AccuracyBadgeProps {
  modelSpread?: {
    temperature: number;
    precipitation: number;
    wind_speed: number;
  };
  dailyConfidence?: number[];
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function AccuracyBadge({ modelSpread, dailyConfidence, showRefresh, onRefresh }: AccuracyBadgeProps) {
  // Calculate expected accuracy from model agreement
  // Lower spread = higher agreement = better expected accuracy

  if (!modelSpread) {
    return null;
  }

  // Base accuracy from model spread (temperature is most important)
  // Spread of 0 = 100% agreement, spread of 5°C+ = significant disagreement
  const tempSpreadFactor = Math.max(0, 100 - (modelSpread.temperature * 10));
  const precipSpreadFactor = Math.max(0, 100 - (modelSpread.precipitation * 5));
  const windSpreadFactor = Math.max(0, 100 - (modelSpread.wind_speed * 2));

  // Weighted average (temperature matters most for perceived accuracy)
  const modelAgreement = (tempSpreadFactor * 0.5 + precipSpreadFactor * 0.3 + windSpreadFactor * 0.2);

  // Average confidence from daily forecasts if available
  const avgDailyConfidence = dailyConfidence && dailyConfidence.length > 0
    ? dailyConfidence.reduce((a, b) => a + b, 0) / dailyConfidence.length
    : 75;

  // Combine model agreement with daily confidence
  const expectedAccuracy = Math.round((modelAgreement * 0.4 + avgDailyConfidence * 0.6));

  const getAccuracyClass = (value: number) => {
    if (value >= 75) return 'accuracy-high';
    if (value >= 50) return 'accuracy-mid-high';
    if (value >= 25) return 'accuracy-mid-low';
    return 'accuracy-low';
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 75) return 'High';
    if (value >= 50) return 'Good';
    if (value >= 25) return 'Fair';
    return 'Low';
  };

  return (
    <div className={`accuracy-badge ${getAccuracyClass(expectedAccuracy)}`}>
      <span className="badge-text">
        {getConfidenceLabel(expectedAccuracy)} confidence · {expectedAccuracy}%
      </span>
      {showRefresh && onRefresh && (
        <button className="badge-refresh" onClick={onRefresh} aria-label="Refresh forecast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      )}
    </div>
  );
}
