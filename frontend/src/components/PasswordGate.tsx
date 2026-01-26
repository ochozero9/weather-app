/**
 * PasswordGate Component
 * ======================
 * Simple password protection for remote access.
 *
 * Access Rules:
 * - localhost/127.0.0.1 → No password needed
 * - Mobile devices (width ≤ 768px) → No password needed
 * - Remote desktop access → Password required
 *
 * Storage:
 * - Uses sessionStorage (cleared when browser tab closes)
 * - Key: 'weather-app-auth'
 *
 * SECURITY NOTES:
 * - This is NOT secure authentication! Password is compared client-side.
 * - Anyone can bypass by viewing source code or disabling JS.
 * - This is just a casual deterrent for accidental access.
 * - For real security, implement server-side authentication.
 *
 * KNOWN LIMITATIONS:
 * 1. Mobile detection uses window.innerWidth at mount time only.
 *    - If user rotates device or resizes window, detection doesn't update.
 *    - A desktop user could resize to < 768px to bypass.
 *
 * 2. ESLint warnings about setState in useEffect are expected.
 *    - The effect runs once on mount to check auth state.
 *    - This is intentional and doesn't cause infinite loops.
 *
 * Future Improvements:
 * - [ ] Use resize observer for responsive mobile detection
 * - [ ] Move to server-side authentication for real security
 * - [ ] Add rate limiting for password attempts
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface PasswordGateProps {
  children: ReactNode;
  password: string;  // Plaintext - visible in source! See security notes above.
}

export function PasswordGate({ children, password }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState(false);
  const [isRemoteAccess, setIsRemoteAccess] = useState(false);

  useEffect(() => {
    // Check if accessing from localhost
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    // LIMITATION: This only checks at mount time, not on resize/rotate
    // A determined user could resize their window to bypass this check
    const isMobile = window.innerWidth <= 768;

    if (isLocal || isMobile) {
      // Local or mobile access - no password needed
      // ESLint warning here is expected - this runs once on mount
      setIsAuthenticated(true);
    } else {
      // Remote desktop access - check session
      setIsRemoteAccess(true);
      const savedAuth = sessionStorage.getItem('weather-app-auth');
      if (savedAuth === 'authenticated') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === password) {
      sessionStorage.setItem('weather-app-auth', 'authenticated');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setInputPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (!isRemoteAccess) {
    // Still checking...
    return null;
  }

  return (
    <div className="password-gate">
      <div className="password-gate-box">
        <h2>Weather App</h2>
        <p>Enter password to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {error && <span className="password-error">Incorrect password</span>}
          <button type="submit">Enter</button>
        </form>
      </div>
    </div>
  );
}
