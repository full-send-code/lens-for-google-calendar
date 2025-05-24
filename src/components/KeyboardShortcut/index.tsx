// KeyboardShortcut.tsx
import React from 'react';
import { ShortcutItem } from "../../types/ShortcutItem";

interface KeyboardShortcutProps {
  text: string;
  onShortcutKeys?: (key: string) => void;
  onKbd?: () => void;
}

const parseShortcutText = (text: string): ShortcutItem => {
  return {
    enabled: text.indexOf('&') >= 0,
    pre: text.substr(0, text.indexOf('&')),
    key: text.substr(text.indexOf('&') + 1, 1),
    post: text.substr(text.indexOf('&') + 2),
    label: text.replace('&', ''),
    text: text,
  };
};

const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ text, onShortcutKeys, onKbd }) => {
  const shortcut = parseShortcutText(text);
  
  React.useEffect(() => {
    if (shortcut.enabled && onShortcutKeys) {
      onShortcutKeys(shortcut.key);
    }
  }, [shortcut, onShortcutKeys]);
  // Keep the functionality but make the element visually hidden
  if (!shortcut.enabled) {
    return null;
  }

  return (
    <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>
      <span className="kbd-hint" onClick={onKbd}>{shortcut.key}</span>
    </span>
  );
};

export default KeyboardShortcut;
