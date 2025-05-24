import React, { useMemo, useCallback, useEffect } from 'react';
import { ShortcutItem } from "../../types/ShortcutItem";
import { startPerformanceTracking, endPerformanceTracking } from '../../utils/logger';

interface KeyboardShortcutProps {
  text: string;
  onShortcutKeys?: (key: string) => void;
  onKbd?: () => void;
}

/**
 * Parses shortcut text into component parts
 * Memoized to avoid recalculation on every render
 * @param text Shortcut text with & marker for the shortcut key
 */
const parseShortcutText = (text: string): ShortcutItem => {
  const enabled = text.indexOf('&') >= 0;
  
  if (!enabled) {
    return {
      enabled: false,
      pre: text,
      key: '',
      post: '',
      label: text,
      text: text,
    };
  }
  
  return {
    enabled,
    pre: text.substr(0, text.indexOf('&')),
    key: text.substr(text.indexOf('&') + 1, 1),
    post: text.substr(text.indexOf('&') + 2),
    label: text.replace('&', ''),
    text: text,
  };
};

/**
 * KeyboardShortcut component for displaying keyboard shortcuts
 * Optimized with memoization and performance tracking
 */
const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ text, onShortcutKeys, onKbd }) => {
  // Memoize the parsed shortcut to avoid recalculation
  const shortcut = useMemo(() => {
    startPerformanceTracking('keyboardShortcut.parse');
    const result = parseShortcutText(text);
    endPerformanceTracking('keyboardShortcut.parse');
    return result;
  }, [text]);

  // Memoize the click handler
  const handleClick = useCallback(() => {
    if (onKbd) {
      startPerformanceTracking('keyboardShortcut.click');
      onKbd();
      endPerformanceTracking('keyboardShortcut.click');
    }
  }, [onKbd]);

  // Register shortcut key with performance tracking
  useEffect(() => {
    if (shortcut.enabled && onShortcutKeys) {
      startPerformanceTracking('keyboardShortcut.register');
      onShortcutKeys(shortcut.key);
      endPerformanceTracking('keyboardShortcut.register');
    }
  }, [shortcut.enabled, shortcut.key, onShortcutKeys]);

  // Keep the functionality but make the element visually hidden
  if (!shortcut.enabled) {
    return null;
  }

  // Memoized styles for better performance
  const hiddenStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden' as const,
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0'
  }), []);

  return (
    <span style={hiddenStyle}>
      <span className="kbd-hint" onClick={handleClick}>
        {shortcut.key}
      </span>
    </span>
  );
};

export default React.memo(KeyboardShortcut);
