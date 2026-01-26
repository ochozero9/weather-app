import { useRef, useEffect, useState } from 'react';
import type { GeocodingResult } from '../types/weather';

interface LocationSelectorProps {
  selectedLocation: GeocodingResult;
  recentLocations: GeocodingResult[];
  onLocationSelect: (location: GeocodingResult) => void;
}

export function LocationSelector({ selectedLocation, recentLocations, onLocationSelect }: LocationSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: GeocodingResult) => {
    onLocationSelect(loc);
    setShowDropdown(false);
  };

  return (
    <div className="location-selector">
      <div className="location-selector-wrapper" ref={dropdownRef}>
        <button
          className="location-selector-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="Select location"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        >
          <span className="location-selector-name">
            {selectedLocation.name}, {selectedLocation.country}
          </span>
          <svg
            className={`location-selector-arrow ${showDropdown ? 'open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showDropdown && (
          <ul className="location-dropdown" role="listbox" aria-label="Recent locations">
            {recentLocations.map((loc) => {
              const isSelected = loc.latitude === selectedLocation.latitude &&
                loc.longitude === selectedLocation.longitude;
              return (
              <li
                key={`${loc.latitude}-${loc.longitude}`}
                className={`location-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(loc)}
                role="option"
                aria-selected={isSelected}
              >
                <span className="location-dropdown-name">{loc.name}</span>
                <span className="location-dropdown-details">
                  {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                </span>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
