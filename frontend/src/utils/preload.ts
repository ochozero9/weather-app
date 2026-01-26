// Preload utilities for lazy-loaded components

let settingsPreloaded = false;
let modelComparisonPreloaded = false;

export function preloadSettings(): void {
  if (settingsPreloaded) return;
  settingsPreloaded = true;
  import('../components/Settings');
}

export function preloadModelComparison(): void {
  if (modelComparisonPreloaded) return;
  modelComparisonPreloaded = true;
  import('../components/ModelComparison');
}
