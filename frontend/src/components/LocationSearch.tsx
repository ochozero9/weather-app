/**
 * LocationSearch Component
 * ========================
 * Autocomplete search input for finding locations by city name or ZIP code.
 *
 * Key Patterns:
 *
 * 1. DEBOUNCING (300ms)
 *    - Prevents API calls on every keystroke
 *    - User must stop typing for 300ms before search fires
 *    - Implemented via setTimeout + clearTimeout
 *
 * 2. REQUEST CANCELLATION (AbortController)
 *    - When user types while a request is in-flight, previous request is aborted
 *    - Prevents race conditions where old results overwrite newer ones
 *    - AbortError is caught and ignored (expected behavior)
 *
 * 3. PORTAL RENDERING (createPortal)
 *    - Dropdown renders at document body level
 *    - Prevents dropdown from being clipped by parent overflow:hidden
 *    - Position is calculated from input's bounding rect
 *    - Updates on scroll/resize to stay aligned
 *
 * 4. KEYBOARD NAVIGATION
 *    - Arrow up/down to navigate results
 *    - Enter to select highlighted result
 *    - Escape to close dropdown
 *
 * Known Limitations:
 * - Dropdown position may lag on fast scroll (updates on scroll event)
 * - No virtual scrolling for very long result lists (unlikely with limit=5)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GeocodingResult } from '../types/weather';
import { geocodeLocation } from '../api/client';

interface LocationSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  initialValue?: string;
  placeholder?: string;
  usePortal?: boolean;  // Set false when used inside a modal (avoids z-index issues)
}

export function LocationSearch({ onLocationSelect, initialValue = '', placeholder = 'Search city or zip code...', usePortal = true }: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastInitialValue = useRef(initialValue);

  // Update dropdown position when showing results or on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    };

    if (showResults) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    // Always return cleanup to prevent memory leaks on unmount
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showResults]);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const data = await geocodeLocation(searchQuery, abortControllerRef.current.signal);
      setResults(data.results);
      setShowResults(data.results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Geocode error:', err);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (location: GeocodingResult) => {
    const displayName = location.admin1
      ? `${location.name}, ${location.admin1}, ${location.country}`
      : `${location.name}, ${location.country}`;
    setQuery(displayName);
    setShowResults(false);
    setSelectedIndex(-1);
    onLocationSelect(location);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Enter' && query.length >= 2) {
        search(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        } else if (results.length > 0) {
          handleSelect(results[0]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Update query when initialValue changes (e.g., from saved location)
  useEffect(() => {
    if (initialValue && initialValue !== lastInitialValue.current) {
      lastInitialValue.current = initialValue;
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="location-search" ref={containerRef}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
          aria-label="Search for a location"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-controls="search-results"
          role="combobox"
        />
        {loading && <span className="search-loading">...</span>}
      </div>

      {showResults && results.length > 0 && (
        usePortal ? createPortal(
          <ul
            ref={dropdownRef}
            id="search-results"
            className="search-results"
            role="listbox"
            aria-label="Location suggestions"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999
            }}
          >
            {results.map((result, index) => (
              <li
                key={`${result.latitude}-${result.longitude}-${index}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={index === selectedIndex ? 'selected' : ''}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <span className="result-name">{result.name}</span>
                <span className="result-details">
                  {result.admin1 && `${result.admin1}, `}
                  {result.country}
                </span>
              </li>
            ))}
          </ul>,
          document.body
        ) : (
          <ul
            ref={dropdownRef}
            id="search-results"
            className="search-results search-results-inline"
            role="listbox"
            aria-label="Location suggestions"
          >
            {results.map((result, index) => (
              <li
                key={`${result.latitude}-${result.longitude}-${index}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={index === selectedIndex ? 'selected' : ''}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <span className="result-name">{result.name}</span>
                <span className="result-details">
                  {result.admin1 && `${result.admin1}, `}
                  {result.country}
                </span>
              </li>
            ))}
          </ul>
        )
      )}

      {showResults && results.length === 0 && !loading && query.length >= 2 && (
        usePortal ? createPortal(
          <div
            className="search-no-results"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999
            }}
          >
            No locations found
          </div>,
          document.body
        ) : (
          <div className="search-no-results search-no-results-inline">
            No locations found
          </div>
        )
      )}
    </div>
  );
}
