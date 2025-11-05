import React from 'react';
import logger from '../../logger';

interface MinimalExtensionProps {}

export const MinimalExtension: React.FC<MinimalExtensionProps> = () => {
  React.useEffect(() => {
    logger.info('Lens Extension React component mounted');
  }, []);

  return (
    <div 
      id="lens-extension-minimal"
      style={{
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dadce0',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'Roboto, Arial, sans-serif',
        color: '#5f6368',
        display: 'inline-block',
        margin: '4px'
      }}
    >
      🔍 Lens Extension Loaded (React)
    </div>
  );
};