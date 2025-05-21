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

  if (!shortcut.enabled) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {shortcut.pre}
      <span className="kbd-hint" onClick={onKbd}>{shortcut.key}</span>
      {shortcut.post}
    </span>
  );
};

export default KeyboardShortcut;
