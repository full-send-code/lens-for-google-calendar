/**
 * Lens Extension Icon Component
 * Uses the actual extension icon from the icons folder with proper centering
 */

import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import logger from '../../infrastructure/logger';

export interface LensIconProps {
  style?: React.CSSProperties;
  size?: number;
}

/**
 * Lens Extension Icon Component
 * 
 * Renders the extension icon with proper fallback handling:
 * - Attempts to load the actual extension icon (icon19.png)
 * - Falls back to Ant Design CalendarOutlined on error
 * - Handles both development and production environments
 */
export const LensIcon: React.FC<LensIconProps> = ({ style, size = 20 }) => {
  const [iconSrc, setIconSrc] = React.useState<string>('');
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    // Try to load the extension icon
    const loadIcon = async () => {
      try {
        if (chrome?.runtime?.getURL) {
          const iconUrl = chrome.runtime.getURL('icons/icon19.png');
          
          // Test if the icon URL actually works by creating a test image
          const testImg = new Image();
          testImg.onload = () => {
            setIconSrc(iconUrl);
          };
          testImg.onerror = () => {
            logger.warn('Extension icon failed to load, using fallback');
            setHasError(true);
          };
          testImg.src = iconUrl;
        } else {
          // Development fallback
          setHasError(true);
        }
      } catch (error) {
        logger.warn('Error loading extension icon:', error);
        setHasError(true);
      }
    };
    
    loadIcon();
  }, []);

  // If we have an error or no src, use the Ant Design fallback
  if (hasError || !iconSrc) {
    return <CalendarOutlined style={{ fontSize: size, ...style }} />;
  }

  return (
    <img
      src={iconSrc}
      alt="Lens Calendar Manager"
      width={size}
      height={size}
      style={{
        display: 'block',
        margin: 'auto',
        objectFit: 'contain',
        ...style
      }}
      onError={() => {
        setHasError(true);
      }}
    />
  );
};